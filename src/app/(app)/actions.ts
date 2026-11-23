'use server'

import { and, eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { getDb } from '@/db'
import { applications, jobMatches, jobs, sources, type ApplicationStatus } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import { runSearch } from '@/jobs/run'
import { isUnofficial } from '@/jobs/unofficial'

const STATUSES: ApplicationStatus[] = ['saved', 'applied', 'oa', 'interview', 'offer', 'rejected']

/** "Did you apply?" → Yes. */
export async function markApplied(jobId: number): Promise<void> {
  const user = await requireUser()
  if (!Number.isInteger(jobId)) return
  const db = await getDb()
  const [job] = await db
    .select({ id: jobs.id, kind: sources.kind })
    .from(jobs)
    .innerJoin(sources, eq(sources.id, jobs.sourceId))
    .where(eq(jobs.id, jobId))
  if (!job || (user.role !== 'admin' && isUnofficial(job.kind))) return
  await db.insert(applications).values({ userId: user.id, jobId, status: 'applied' }).onConflictDoNothing()
  refresh()
}

export async function setApplicationStatus(id: number, status: ApplicationStatus): Promise<void> {
  const user = await requireUser()
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return
  const db = await getDb()
  await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
  refresh()
}

export async function removeApplication(id: number): Promise<void> {
  const user = await requireUser()
  if (!Number.isInteger(id)) return
  const db = await getDb()
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, user.id)))
  refresh()
}

/** Hide a role from this person's lists (it stays hidden when the search sees it again). `false` undoes it. */
export async function setDismissed(jobId: number, dismissed: boolean): Promise<void> {
  const user = await requireUser()
  if (!Number.isInteger(jobId)) return
  const db = await getDb()
  const [job] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId))
  if (!job) return
  const dismissedAt = dismissed ? new Date() : null
  await db
    .insert(jobMatches)
    .values({ userId: user.id, jobId, dismissedAt })
    .onConflictDoUpdate({ target: [jobMatches.userId, jobMatches.jobId], set: { dismissedAt } })
  refresh()
}

export type RunNowResult = { ok: boolean; message: string }

/** "Run search now": waits for the run, then refreshes the page. */
export async function runSearchNow(): Promise<RunNowResult> {
  await requireUser()
  const db = await getDb()
  const summary = await runSearch(db, 'manual')
  refresh()
  if (!summary) return { ok: false, message: 'A search is already running. Refresh in a minute.' }
  return {
    ok: true,
    message: `${summary.added} new, ${summary.kept} matching from ${summary.sourcesOk} sources${
      summary.sourcesFailed ? ` (${summary.sourcesFailed} failed)` : ''
    }.`,
  }
}
