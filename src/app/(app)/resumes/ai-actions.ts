'use server'

import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { abouts } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import { AiNotConfiguredError, generateJson } from '@/lib/ai/gemini'
import { AI_DAILY_LIMIT, takeAiRequest, takeBurst } from '@/lib/ai/limits'
import { buildAssistantPrompt, editablePaths, validateSuggestions, type Suggestion } from '@/resume/ai'
import { toContent, type ResumeContent } from '@/resume/types'

export type AssistantInput = {
  resumeId: number
  /** The unsaved content the editor currently holds. */
  content: ResumeContent
  prompt: string
  /** A block such as "experience.<id>" to limit edits to; omit to allow the whole resume. */
  focusBlock?: string
  jobDescription?: string
}

export type AssistantResult =
  { ok: true; message: string; suggestions: Suggestion[] } | { ok: false; error: string; notConfigured?: boolean }

const PROMPT_MAX = 1000
const JOB_MAX = 8000
const CONTENT_MAX = 200_000

export async function askResumeAssistant(input: AssistantInput): Promise<AssistantResult> {
  const user = await requireUser()

  const prompt = typeof input?.prompt === 'string' ? input.prompt.trim() : ''
  if (!prompt) return { ok: false, error: 'Tell the assistant what to change.' }
  if (prompt.length > PROMPT_MAX) return { ok: false, error: `Keep the request under ${PROMPT_MAX} characters.` }
  if (!Number.isSafeInteger(input.resumeId)) return { ok: false, error: 'Resume not found.' }
  const content = toContent(input.content)
  if (!content || JSON.stringify(content).length > CONTENT_MAX)
    return { ok: false, error: 'This resume cannot be read.' }
  const jobDescription = typeof input.jobDescription === 'string' ? input.jobDescription.trim() : ''
  if (jobDescription.length > JOB_MAX)
    return { ok: false, error: `Keep the job description under ${JOB_MAX} characters.` }
  const focusBlock = typeof input.focusBlock === 'string' && input.focusBlock ? input.focusBlock : undefined

  if (!process.env.GEMINI_API_KEY)
    return { ok: false, notConfigured: true, error: 'Add GEMINI_API_KEY to .env.local to use the assistant.' }

  const allowed = editablePaths(content, focusBlock)
  if (!allowed.length) return { ok: false, error: 'There is nothing to edit in that part of the resume.' }

  if (!takeBurst(user.id))
    return { ok: false, error: 'Too many assistant requests in a short time. Wait a few minutes and try again.' }

  try {
    const db = await getDb()
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
    const built = buildAssistantPrompt({
      content,
      prompt,
      focusBlock,
      about: rows.map((r) => r.text),
      jobDescription: jobDescription || undefined,
    })
    const { data } = await generateJson<unknown>({ ...built, maxOutputTokens: 4096 })
    return { ok: true, ...validateSuggestions(content, data, allowed) }
  } catch (e) {
    if (e instanceof AiNotConfiguredError)
      return { ok: false, notConfigured: true, error: 'Add GEMINI_API_KEY to .env.local to use the assistant.' }
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
