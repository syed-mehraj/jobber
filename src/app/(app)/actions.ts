'use server'

import { eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { getDb } from '@/db'
import { applications, jobs, type ApplicationStatus } from '@/db/schema'
import { requireSession } from '@/lib/auth/session'
import { runSearch } from '@/jobs/run'

const STATUSES: ApplicationStatus[] = ['saved', 'applied', 'oa', 'interview', 'offer', 'rejected']

/** "Did you apply?" → Yes. */
export async function markApplied(jobId: number): Promise<void> {
  await requireSession()
  if (!Number.isInteger(jobId)) return
  const db = await getDb()
  const [job] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId))
  if (!job) return
  await db.insert(applications).values({ jobId, status: 'applied' }).onConflictDoNothing()
  refresh()
}

export async function setApplicationStatus(id: number, status: ApplicationStatus): Promise<void> {
  await requireSession()
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return
  const db = await getDb()
  await db.update(applications).set({ status, updatedAt: new Date() }).where(eq(applications.id, id))
  refresh()
}

export async function removeApplication(id: number): Promise<void> {
  await requireSession()
  if (!Number.isInteger(id)) return
  const db = await getDb()
  await db.delete(applications).where(eq(applications.id, id))
  refresh()
}

/** Hide a role from the lists (it stays hidden when the search sees it again). `restore` undoes it. */
export async function setDismissed(jobId: number, dismissed: boolean): Promise<void> {
  await requireSession()
  if (!Number.isInteger(jobId)) return
  const db = await getDb()
  await db
    .update(jobs)
    .set({ dismissedAt: dismissed ? new Date() : null })
    .where(eq(jobs.id, jobId))
  refresh()
}

export type RunNowResult = { ok: boolean; message: string }

/** "Run search now": waits for the run, then refreshes the page. */
export async function runSearchNow(): Promise<RunNowResult> {
  await requireSession()
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
