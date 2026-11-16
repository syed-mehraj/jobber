import 'server-only'
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { after, connection } from 'next/server'
import { getDb } from '@/db'
import { applications, jobs, resumes, sources, type ApplicationStatus, type Level, type Region } from '@/db/schema'
import { requireSession } from '@/lib/auth/session'
import { isStale, lastRun, runSearch } from '@/jobs/run'

/*
 * Every read the pages make. Each one checks the session first (the proxy is not the only guard),
 * and kicks off a background search when the last one is older than REFRESH_MINUTES, so opening or
 * refreshing the app keeps the jobs current.
 */

const REFRESH_MINUTES = Number(process.env.REFRESH_MINUTES) || 10

async function db() {
  // Everything below depends on the request and the current time, so it is never prerendered.
  await connection()
  await requireSession()
  return getDb()
}

/** Starts a search after the response is sent, if the last one is stale. The next refresh shows the results. */
export async function refreshIfStale(): Promise<void> {
  const d = await db()
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

const open = isNull(jobs.closedAt)
const notApplied = sql`not exists (select 1 from ${applications} where ${applications.jobId} = ${jobs.id})`

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
  const d = await db()
  const [[r], [m], [t], [a], [i], [w], [o]] = await Promise.all([
    d.select({ n: count() }).from(resumes),
    d.select({ n: count() }).from(jobs).where(and(open, notApplied)),
    d
      .select({ n: count() })
      .from(jobs)
      .where(and(open, notApplied, gte(jobs.firstSeenAt, startOfTodayIst()))),
    d
      .select({ n: count() })
      .from(applications)
      .where(sql`${applications.status} <> 'saved'`),
    d
      .select({ n: count() })
      .from(applications)
      .where(inArray(applications.status, ['oa', 'interview'])),
    d.select({ n: count() }).from(applications).where(eq(applications.status, 'applied')),
    d.select({ n: count() }).from(applications).where(eq(applications.status, 'offer')),
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
  source: string
  /** greenhouse, lever, ashby, smartrecruiters, simplify, hackernews */
  sourceKind: string
  applied: boolean
  /** First seen in the last 24 hours. */
  isNew: boolean
}

const jobColumns = {
  id: jobs.id,
  title: jobs.title,
  company: jobs.company,
  location: jobs.location,
  region: jobs.region,
  level: jobs.level,
  category: jobs.category,
  url: jobs.url,
  score: jobs.score,
  postedAt: jobs.postedAt,
  firstSeenAt: jobs.firstSeenAt,
  reasons: jobs.reasons,
  flags: jobs.flags,
  matched: jobs.matched,
  source: sources.name,
  sourceKind: sources.kind,
  applied: sql<boolean>`exists (select 1 from ${applications} where ${applications.jobId} = ${jobs.id})`,
  isNew: sql<boolean>`${jobs.firstSeenAt} > now() - interval '24 hours'`,
}

export async function getTopMatches(limit = 5): Promise<JobRow[]> {
  const d = await db()
  return d
    .select(jobColumns)
    .from(jobs)
    .innerJoin(sources, eq(sources.id, jobs.sourceId))
    .where(and(open, notApplied))
    .orderBy(desc(jobs.score), desc(jobs.firstSeenAt))
    .limit(limit)
}

export type JobFilter = { level?: Level | 'all'; region?: Region | 'all'; category?: string; sort?: 'best' | 'newest' }

export async function getJobs(filter: JobFilter = {}, limit = 200): Promise<{ rows: JobRow[]; total: number }> {
  const d = await db()
  const where = [open]
  if (filter.level && filter.level !== 'all') where.push(eq(jobs.level, filter.level))
  if (filter.region && filter.region !== 'all') where.push(eq(jobs.region, filter.region))
  if (filter.category && filter.category !== 'all') where.push(eq(jobs.category, filter.category))
  const order =
    filter.sort === 'newest' ? [desc(jobs.firstSeenAt), desc(jobs.score)] : [desc(jobs.score), desc(jobs.firstSeenAt)]
  const [rows, [{ n }]] = await Promise.all([
    d
      .select(jobColumns)
      .from(jobs)
      .innerJoin(sources, eq(sources.id, jobs.sourceId))
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

export async function getSources(): Promise<SourceRow[]> {
  const d = await db()
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
  const d = await db()
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
    .orderBy(desc(applications.appliedAt))
}

export type JobDetail = JobRow & { summary: string | null; closed: boolean }

/** One job with its description, for the Jobs side panel. */
export async function getJob(id: number): Promise<JobDetail | null> {
  if (!Number.isInteger(id)) return null
  const d = await db()
  const [row] = await d
    .select({ ...jobColumns, summary: jobs.summary, closed: sql<boolean>`${jobs.closedAt} is not null` })
    .from(jobs)
    .innerJoin(sources, eq(sources.id, jobs.sourceId))
    .where(eq(jobs.id, id))
  return row ?? null
}
