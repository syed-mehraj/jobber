import { and, desc, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { jobs, runs, sources } from '@/db/schema'
import { adapters, UNOFFICIAL_KINDS } from './adapters'
import { countryOf } from './countries'
import { classify } from './filters'
import { rescore } from './matches'
import { scoreJob, type Profile } from './score'
import type { Adapter } from './types'

export type RunSummary = {
  runId: number
  sourcesOk: number
  sourcesFailed: number
  seen: number
  kept: number
  added: number
  closed: number
}

const CONCURRENCY = 12
/** Minimum gap between reads of an unofficial source. */
const UNOFFICIAL_INTERVAL_MS = 60 * 60 * 1000
/** A run that hasn't finished after this long is treated as dead, so a crash can't block searches forever. */
const STALE_LOCK_MS = 10 * 60 * 1000

/** Runs every enabled source once. Returns null if another run is already going. */
export async function runSearch(
  db: DB,
  trigger: 'refresh' | 'manual' | 'cron',
  options: { adapters?: Record<string, Adapter>; now?: () => Date } = {},
): Promise<RunSummary | null> {
  const use = options.adapters ?? adapters
  const now = options.now ?? (() => new Date())
  const started = now()

  // One run at a time.
  const [busy] = await db
    .select({ id: runs.id })
    .from(runs)
    .where(and(isNull(runs.finishedAt), gt(runs.startedAt, new Date(started.getTime() - STALE_LOCK_MS))))
    .limit(1)
  if (busy) return null

  const [run] = await db.insert(runs).values({ trigger, startedAt: started }).returning({ id: runs.id })
  // Jobs are shared; this base score ignores skills. Each person's score is in job_matches (rescore below).
  const profile: Profile = { skills: [], preferred: [] }
  // Unofficial sources (big-tech careers sites) are read at most once an hour, whatever triggered the run.
  const list = (await db.select().from(sources).where(eq(sources.enabled, true))).filter(
    (s) =>
      !UNOFFICIAL_KINDS.has(s.kind) ||
      !s.lastRunAt ||
      started.getTime() - s.lastRunAt.getTime() >= UNOFFICIAL_INTERVAL_MS,
  )

  const totals = { sourcesOk: 0, sourcesFailed: 0, seen: 0, kept: 0, added: 0, closed: 0 }
  const errors: { source: string; error: string }[] = []

  async function runOne(source: (typeof list)[number]) {
    const adapter = use[source.kind]
    if (!adapter) return
    const at = now()
    try {
      const postings = await adapter(source.config, source.name)
      const keptRows = []
      // Some companies post the same role several times (one per opening); keep one per title and location.
      const seenRoles = new Set<string>()
      for (const p of postings) {
        const c = classify(p, at)
        if (!c.keep) continue
        const roleKey = `${p.title.toLowerCase().replace(/\s+/g, ' ').trim()}|${p.location.toLowerCase()}`
        if (seenRoles.has(roleKey)) continue
        seenRoles.add(roleKey)
        const s = scoreJob(p, c, profile, at)
        keptRows.push({
          sourceId: source.id,
          externalId: p.externalId,
          company: p.company,
          title: p.title,
          location: p.location
            .replace(/,(\s*,)+/g, ',')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 300),
          region: c.region,
          country: countryOf(p.location),
          level: c.level,
          category: c.category,
          url: p.url,
          postedAt: p.postedAt ?? null,
          firstSeenAt: at,
          lastSeenAt: at,
          closedAt: null,
          score: s.score,
          matched: s.matched,
          required: s.required,
          missing: s.missing,
          reasons: s.reasons,
          flags: c.flags,
          summary: p.description?.slice(0, 2000) ?? null,
        })
      }

      // Count what is new before writing.
      const ids = keptRows.map((r) => r.externalId)
      let existing = 0
      if (ids.length) {
        const [{ n }] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(jobs)
          .where(and(eq(jobs.sourceId, source.id), inArray(jobs.externalId, ids)))
        existing = n
      }

      for (let i = 0; i < keptRows.length; i += 200) {
        await db
          .insert(jobs)
          .values(keptRows.slice(i, i + 200))
          .onConflictDoUpdate({
            target: [jobs.sourceId, jobs.externalId],
            set: {
              company: sql`excluded.company`,
              title: sql`excluded.title`,
              location: sql`excluded.location`,
              region: sql`excluded.region`,
              country: sql`excluded.country`,
              level: sql`excluded.level`,
              category: sql`excluded.category`,
              url: sql`excluded.url`,
              postedAt: sql`excluded.posted_at`,
              lastSeenAt: sql`excluded.last_seen_at`,
              closedAt: null,
              score: sql`excluded.score`,
              matched: sql`excluded.matched`,
              required: sql`excluded.required`,
              missing: sql`excluded.missing`,
              reasons: sql`excluded.reasons`,
              flags: sql`excluded.flags`,
              summary: sql`excluded.summary`,
            },
          })
      }

      // Anything from this source not seen in this run has been taken down (or no longer passes the filters).
      // Skip when the source returned nothing at all: that's more likely a glitch than every job closing.
      let closed = 0
      if (postings.length > 0) {
        const closedRows = await db
          .update(jobs)
          .set({ closedAt: at })
          .where(and(eq(jobs.sourceId, source.id), isNull(jobs.closedAt), lt(jobs.lastSeenAt, at)))
          .returning({ id: jobs.id })
        closed = closedRows.length
      }

      await db
        .update(sources)
        .set({
          lastRunAt: at,
          lastSuccessAt: at,
          lastError: null,
          lastSeen: postings.length,
          lastKept: keptRows.length,
        })
        .where(eq(sources.id, source.id))

      totals.sourcesOk++
      totals.seen += postings.length
      totals.kept += keptRows.length
      totals.added += keptRows.length - existing
      totals.closed += closed
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push({ source: source.name, error: message.slice(0, 300) })
      totals.sourcesFailed++
      await db
        .update(sources)
        .set({ lastRunAt: at, lastError: message.slice(0, 500) })
        .where(eq(sources.id, source.id))
    }
  }

  // A small worker pool, so one slow source doesn't hold up the rest.
  const queue = [...list]
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let s = queue.shift(); s; s = queue.shift()) await runOne(s)
    }),
  )

  // Score every open job for every person against their own resume and About you.
  try {
    await rescore(db, { now: now() })
  } catch (error) {
    errors.push({ source: 'Scoring', error: (error instanceof Error ? error.message : String(error)).slice(0, 300) })
  }

  await db
    .update(runs)
    .set({ finishedAt: now(), ...totals, errors })
    .where(eq(runs.id, run.id))
  return { runId: run.id, ...totals }
}

/** The most recent run (finished or not). */
export async function lastRun(db: DB) {
  const [row] = await db.select().from(runs).orderBy(desc(runs.startedAt)).limit(1)
  return row
}

/** True when the last run started more than `minutes` ago (or there has never been one). */
export async function isStale(db: DB, minutes: number, now = new Date()): Promise<boolean> {
  const row = await lastRun(db)
  return !row || now.getTime() - row.startedAt.getTime() > minutes * 60 * 1000
}
