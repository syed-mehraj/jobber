import 'server-only'
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { after, connection } from 'next/server'
import { getDb } from '@/db'
import {
  applications,
  jobMatches,
  jobs,
  resumes,
  sources,
  type ApplicationStatus,
  type Level,
  type Region,
} from '@/db/schema'
import { requireAdmin, requireUser, type CurrentUser } from '@/lib/auth/session'
import { needsScores, rescore } from '@/jobs/matches'
import { isStale, lastRun, runSearch } from '@/jobs/run'
import { UNOFFICIAL_KINDS } from '@/jobs/unofficial'

/*
 * Every read the pages make. Each one checks the session first (the proxy is not the only guard),
 * and kicks off a background search when the last one is older than REFRESH_MINUTES, so opening or
 * refreshing the app keeps the jobs current.
 */

const REFRESH_MINUTES = Number(process.env.REFRESH_MINUTES) || 10

async function db() {
  // Everything below depends on the request and the current time, so it is never prerendered.
  await connection()
  await requireUser()
  return getDb()
}

/** The database and the signed-in person. Every per-person query filters by `user.id`. */
async function ctx(): Promise<{ d: Awaited<ReturnType<typeof getDb>>; user: CurrentUser }> {
  await connection()
  const user = await requireUser()
  return { d: await getDb(), user }
}

/**
 * Starts a search after the response is sent, if the last one is stale. The next refresh shows the results.
 * A new account gets its scores straight away instead of waiting for the next search.
 */
export async function refreshIfStale(): Promise<void> {
  const { d, user } = await ctx()
  if (await needsScores(d, user.id)) await rescore(d, { userIds: [user.id] })
  if (await isStale(d, REFRESH_MINUTES)) {
    after(async () => {
      await runSearch(d, 'refresh').catch((e) => console.error('[search] background run failed:', e))
    })
  }
}

/** Midnight in India today, as a Date. */
function startOfTodayIst(now = new Date()): Date {
  const ist = new Date(now.getTime() + 5.5 * 3600000)
  ist.setUTCHours(0, 0, 0, 0)
  return new Date(ist.getTime() - 5.5 * 3600000)
}

const unofficialKinds = [...UNOFFICIAL_KINDS]

/**
 * Jobs this person sees: still posted, not dismissed by them, and (for everyone but the admin) not from the
 * unofficial big-tech readers, which the owner chose to read for personal use only.
 */
const open = (user: CurrentUser) =>
  and(
    isNull(jobs.closedAt),
    sql`not exists (select 1 from ${jobMatches} where ${jobMatches.jobId} = ${jobs.id} and ${jobMatches.userId} = ${user.id} and ${jobMatches.dismissedAt} is not null)`,
    user.role === 'admin' || unofficialKinds.length === 0
      ? undefined
      : sql`not exists (select 1 from ${sources} where ${sources.id} = ${jobs.sourceId} and ${sources.kind} in (${sql.join(
          unofficialKinds.map((k) => sql`${k}`),
          sql`, `,
        )}))`,
  )!
/** The signed-in person hasn't applied to the job. */
const notApplied = (userId: string) =>
  sql`not exists (select 1 from ${applications} where ${applications.jobId} = ${jobs.id} and ${applications.userId} = ${userId})`

export type Counts = {
  resumes: number
  newMatches: number
  newToday: number
  applied: number
  /** Applied and not heard back yet. */
  waiting: number
  interviews: number
  offers: number
}

export async function getCounts(): Promise<Counts> {
  const { d, user } = await ctx()
  const mine = eq(applications.userId, user.id)
  const [[r], [m], [t], [a], [i], [w], [o]] = await Promise.all([
    d.select({ n: count() }).from(resumes).where(eq(resumes.userId, user.id)),
    d
      .select({ n: count() })
      .from(jobs)
      .where(and(open(user), notApplied(user.id))),
    d
      .select({ n: count() })
      .from(jobs)
      .where(and(open(user), notApplied(user.id), gte(jobs.firstSeenAt, startOfTodayIst()))),
    d
      .select({ n: count() })
      .from(applications)
      .where(and(mine, sql`${applications.status} <> 'saved'`)),
    d
      .select({ n: count() })
      .from(applications)
      .where(and(mine, inArray(applications.status, ['oa', 'interview']))),
    d
      .select({ n: count() })
      .from(applications)
      .where(and(mine, eq(applications.status, 'applied'))),
    d
      .select({ n: count() })
      .from(applications)
      .where(and(mine, eq(applications.status, 'offer'))),
  ])
  return {
    resumes: r.n,
    newMatches: m.n,
    newToday: t.n,
    applied: a.n,
    waiting: w.n,
    interviews: i.n,
    offers: o.n,
  }
}

export type JobRow = {
  id: number
  title: string
  company: string
  location: string
  region: Region
  level: Level
  category: string
  url: string
  score: number
  postedAt: Date | null
  firstSeenAt: Date
  reasons: string[]
  flags: string[]
  matched: string[]
  /** Skills the posting asks for that the profile doesn't list. */
  missing: string[]
  required: string[]
  source: string
  /** greenhouse, lever, ashby, smartrecruiters, simplify, hackernews */
  sourceKind: string
  applied: boolean
  /** First seen in the last 24 hours. */
  isNew: boolean
  /** ISO country code, when the location names a known country. */
  country: string | null
}

/** This person's score for the job (from job_matches). */
const myScore = sql<number>`coalesce(${jobMatches.score}, 0)`
const myMatch = (userId: string) => and(eq(jobMatches.jobId, jobs.id), eq(jobMatches.userId, userId))

const jobColumns = (userId: string) => ({
  id: jobs.id,
  title: jobs.title,
  company: jobs.company,
  location: jobs.location,
  region: jobs.region,
  level: jobs.level,
  category: jobs.category,
  url: jobs.url,
  score: sql<number>`coalesce(${jobMatches.score}, 0)`.mapWith(Number),
  postedAt: jobs.postedAt,
  firstSeenAt: jobs.firstSeenAt,
  reasons: sql<string[]>`coalesce(${jobMatches.reasons}, '{}'::text[])`,
  flags: jobs.flags,
  matched: sql<string[]>`coalesce(${jobMatches.matched}, '{}'::text[])`,
  missing: sql<string[]>`coalesce(${jobMatches.missing}, '{}'::text[])`,
  required: jobs.required,
  source: sources.name,
  sourceKind: sources.kind,
  applied: sql<boolean>`exists (select 1 from ${applications} where ${applications.jobId} = ${jobs.id} and ${applications.userId} = ${userId})`,
  isNew: sql<boolean>`${jobs.firstSeenAt} > now() - interval '24 hours'`,
  country: jobs.country,
})

export async function getTopMatches(limit = 5): Promise<JobRow[]> {
  const { d, user } = await ctx()
  return d
    .select(jobColumns(user.id))
    .from(jobs)
    .innerJoin(sources, eq(sources.id, jobs.sourceId))
    .leftJoin(jobMatches, myMatch(user.id))
    .where(and(open(user), notApplied(user.id)))
    .orderBy(desc(myScore), desc(jobs.firstSeenAt))
    .limit(limit)
}

export type JobFilter = {
  /** "home": India and remote roles. "abroad": roles in other countries with visa or relocation support. */
  scope?: 'home' | 'abroad'
  level?: Level | 'all'
  region?: Region | 'all'
  country?: string | 'all'
  category?: string
  sort?: 'best' | 'newest'
}

export async function getJobs(filter: JobFilter = {}, limit = 200): Promise<{ rows: JobRow[]; total: number }> {
  const { d, user } = await ctx()
  const where = [open(user)]
  if (filter.scope === 'abroad') where.push(eq(jobs.region, 'international'))
  else if (filter.scope === 'home') where.push(ne(jobs.region, 'international'))
  if (filter.level && filter.level !== 'all') where.push(eq(jobs.level, filter.level))
  if (filter.region && filter.region !== 'all') where.push(eq(jobs.region, filter.region))
  if (filter.country && filter.country !== 'all') where.push(eq(jobs.country, filter.country))
  if (filter.category && filter.category !== 'all') where.push(eq(jobs.category, filter.category))
  const order =
    filter.sort === 'newest' ? [desc(jobs.firstSeenAt), desc(myScore)] : [desc(myScore), desc(jobs.firstSeenAt)]
  const [rows, [{ n }]] = await Promise.all([
    d
      .select(jobColumns(user.id))
      .from(jobs)
      .innerJoin(sources, eq(sources.id, jobs.sourceId))
      .leftJoin(jobMatches, myMatch(user.id))
      .where(and(...where))
      .orderBy(...order)
      .limit(limit),
    d
      .select({ n: count() })
      .from(jobs)
      .where(and(...where)),
  ])
  return { rows, total: n }
}

/** Open roles abroad per country, most first; and the count for home (India + remote). */
export async function getScopeCounts(): Promise<{
  home: number
  abroad: number
  byCountry: { country: string; n: number }[]
}> {
  const { d, user } = await ctx()
  const rows = await d
    .select({ region: jobs.region, country: jobs.country, n: count() })
    .from(jobs)
    .where(open(user))
    .groupBy(jobs.region, jobs.country)
  let home = 0
  let abroad = 0
  const by = new Map<string, number>()
  for (const r of rows) {
    if (r.region === 'international') {
      abroad += r.n
      const c = r.country ?? 'other'
      by.set(c, (by.get(c) ?? 0) + r.n)
    } else home += r.n
  }
  return {
    home,
    abroad,
    byCountry: [...by.entries()].map(([country, n]) => ({ country, n })).sort((a, b) => b.n - a.n),
  }
}

export type SearchStatus = {
  running: boolean
  lastRunAt: Date | null
  sourcesWorking: number
  sourcesTotal: number
  lastAdded: number
  refreshMinutes: number
}

export async function getSearchStatus(): Promise<SearchStatus> {
  const d = await db()
  const [run, [ok], [all]] = await Promise.all([
    lastRun(d),
    d
      .select({ n: count() })
      .from(sources)
      .where(and(eq(sources.enabled, true), isNotNull(sources.lastSuccessAt), isNull(sources.lastError))),
    d.select({ n: count() }).from(sources).where(eq(sources.enabled, true)),
  ])
  return {
    running: Boolean(run && !run.finishedAt && Date.now() - run.startedAt.getTime() < 10 * 60000),
    lastRunAt: run?.finishedAt ?? null,
    sourcesWorking: ok.n,
    sourcesTotal: all.n,
    lastAdded: run?.added ?? 0,
    refreshMinutes: REFRESH_MINUTES,
  }
}

export type SourceRow = {
  id: number
  name: string
  kind: string
  enabled: boolean
  lastSuccessAt: Date | null
  lastError: string | null
  lastSeen: number
  lastKept: number
}

/** Admin only: the source list names the unofficial big-tech readers. */
export async function getSources(): Promise<SourceRow[]> {
  await connection()
  await requireAdmin()
  const d = await getDb()
  return d
    .select({
      id: sources.id,
      name: sources.name,
      kind: sources.kind,
      enabled: sources.enabled,
      lastSuccessAt: sources.lastSuccessAt,
      lastError: sources.lastError,
      lastSeen: sources.lastSeen,
      lastKept: sources.lastKept,
    })
    .from(sources)
    .orderBy(desc(sources.lastKept), sources.name)
}

export type ApplicationRow = {
  id: number
  status: ApplicationStatus
  appliedAt: Date
  title: string
  company: string
  location: string
  url: string
  closed: boolean
}

export async function getApplications(): Promise<ApplicationRow[]> {
  const { d, user } = await ctx()
  return d
    .select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
      url: jobs.url,
      closed: sql<boolean>`${jobs.closedAt} is not null`,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.userId, user.id))
    .orderBy(desc(applications.appliedAt))
}

export type JobDetail = JobRow & { summary: string | null; closed: boolean; dismissed: boolean }

/** One job with its description, for the Jobs side panel. */
export async function getJob(id: number): Promise<JobDetail | null> {
  if (!Number.isInteger(id)) return null
  const { d, user } = await ctx()
  const [row] = await d
    .select({
      ...jobColumns(user.id),
      summary: jobs.summary,
      closed: sql<boolean>`${jobs.closedAt} is not null`,
      dismissed: sql<boolean>`${jobMatches.dismissedAt} is not null`,
    })
    .from(jobs)
    .innerJoin(sources, eq(sources.id, jobs.sourceId))
    .leftJoin(jobMatches, myMatch(user.id))
    .where(eq(jobs.id, id))
  if (!row) return null
  // Unofficial big-tech jobs are the admin's only.
  if (user.role !== 'admin' && UNOFFICIAL_KINDS.has(row.sourceKind)) return null
  return row
}
