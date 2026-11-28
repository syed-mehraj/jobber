'use server'

import { desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { abouts, resumes } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import { AiNotConfiguredError, generateJson } from '@/lib/ai/gemini'
import { AI_DAILY_LIMIT, takeAiRequest, takeBurst } from '@/lib/ai/limits'
import { getJob } from '@/lib/data'
import { buildAdvicePrompt, validateAdvice, type JobAdvice } from '@/jobs/advice'
import { toDesign } from '@/resume/design'
import { MAX_RESUMES } from '@/resume/limits'
import { masterResume } from '@/resume/master'
import { MAX_SUGGESTIONS, validateSuggestions } from '@/resume/ai'
import { setAt } from '@/resume/paths'
import { toContent } from '@/resume/types'

export type AdviceResult = { ok: true; advice: JobAdvice } | { ok: false; error: string; notConfigured?: boolean }

const NOT_CONFIGURED = 'The AI assistant is not switched on for this site yet.'

/** Resume advice for one job, worked out against the signed-in person's master resume and About you. */
export async function adviseForJob(jobId: number): Promise<AdviceResult> {
  const user = await requireUser()
  if (!Number.isSafeInteger(jobId)) return { ok: false, error: 'Job not found.' }
  if (!process.env.GEMINI_API_KEY) return { ok: false, notConfigured: true, error: NOT_CONFIGURED }

  // getJob applies the same visibility rules as the Jobs page (e.g. unofficial jobs are the admin's only).
  const job = await getJob(jobId)
  if (!job) return { ok: false, error: 'Job not found.' }

  if (!takeBurst(user.id))
    return { ok: false, error: 'Too many assistant requests in a short time. Wait a few minutes and try again.' }

  try {
    const db = await getDb()
    const [master] = await db.select().from(resumes).where(eq(resumes.userId, user.id)).orderBy(desc(resumes.isMaster))
    const content = toContent(master?.content)
    if (!master?.isMaster || !content)
      return { ok: false, error: 'Add your master resume first (Resumes), then ask again.' }

    if (!(await takeAiRequest(db, user.id, user.role)))
      return {
        ok: false,
        error: `You've used today's ${AI_DAILY_LIMIT[user.role]} assistant requests. They reset at midnight (India time).`,
      }
    const rows = await db
      .select({ text: abouts.text })
      .from(abouts)
      .where(eq(abouts.userId, user.id))
      .orderBy(desc(abouts.updatedAt))
    const built = buildAdvicePrompt({
      job: {
        title: job.title,
        company: job.company,
        location: job.location,
        level: job.level,
        required: job.required,
        matched: job.matched,
        missing: job.missing,
        summary: job.summary,
      },
      content,
      about: rows.map((r) => r.text),
    })
    const { data } = await generateJson<unknown>({ ...built, maxOutputTokens: 8192, thinkingBudget: 1024 })
    return {
      ok: true,
      advice: validateAdvice(
        content,
        data,
        rows.map((r) => r.text),
      ),
    }
  } catch (e) {
    if (e instanceof AiNotConfiguredError) return { ok: false, notConfigured: true, error: NOT_CONFIGURED }
    const message = e instanceof Error ? e.message : ''
    return {
      ok: false,
      error:
        message.startsWith('Gemini') || message.startsWith('Could not reach')
          ? message
          : 'The assistant failed. Try again.',
    }
  }
}

export type TailorResult = { ok: false; error: string }

/**
 * A new resume for this job: a copy of the master with the edits the person ticked applied. Each edit is checked
 * again here against the master (existing text only, no contact links), so nothing else can be written.
 */
export async function createTailoredResume(
  jobId: number,
  accepted: { path: string; after: string }[],
): Promise<TailorResult> {
  const user = await requireUser()
  if (!Number.isSafeInteger(jobId)) return { ok: false, error: 'Job not found.' }
  const job = await getJob(jobId)
  if (!job) return { ok: false, error: 'Job not found.' }

  const db = await getDb()
  const all = await db.select().from(resumes).where(eq(resumes.userId, user.id))
  if (all.length >= MAX_RESUMES)
    return { ok: false, error: `You can keep up to ${MAX_RESUMES} resumes. Delete one first.` }
  const master = all.find((r) => r.isMaster)
  const base = toContent(master?.content) ?? masterResume

  const wanted = (Array.isArray(accepted) ? accepted : []).slice(0, MAX_SUGGESTIONS).map((a) => ({
    path: typeof a?.path === 'string' ? a.path : '',
    after: typeof a?.after === 'string' ? a.after : '',
    reason: '',
  }))
  const { suggestions } = validateSuggestions(base, { message: '', suggestions: wanted })
  let content = structuredClone(base)
  for (const s of suggestions) content = setAt(content, s.path, s.after)

  const [row] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      name: `${job.title} – ${job.company}`.slice(0, 120),
      target: job.company.slice(0, 120),
      isMaster: false,
      content,
      design: toDesign(master?.design ?? {}),
    })
    .returning({ id: resumes.id })
  redirect(`/resumes/${row.id}/edit`)
}
