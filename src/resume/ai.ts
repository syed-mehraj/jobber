import { allTextFields, fieldsOf, getAt, type FieldInfo } from './paths'
import type { ResumeContent } from './types'

/*
 * The resume assistant, pure part: build the prompt and check what the model sends back.
 * The model only ever proposes edits. The editor shows each one as before/after and the user accepts or rejects it.
 */

export type Suggestion = { path: string; before: string; after: string; reason: string }

export const MAX_SUGGESTIONS = 12
const MAX_AFTER = 600
const LINK_FIELDS = new Set(['contact.email', 'contact.github', 'contact.linkedin', 'contact.website'])

const SYSTEM = `You edit the text of a resume for a final-year computer science student applying for software roles. You propose edits; the student reviews each one and accepts or rejects it.

Rules:
1. Only rewrite text at the paths listed under EDITABLE FIELDS. Use each path exactly as given. Fields under READ-ONLY CONTEXT may be read but must never appear in your suggestions.
2. Stay strictly within the facts in the resume and the "About you" texts. Never add a number, percentage, tool, technology, employer, job title, degree, grade or date that does not already appear there. Never exaggerate scope or ownership.
3. If the request needs a fact that is not available (for example "add numbers" when the resume has none), say so in "message" and suggest wording with a "[add number]" placeholder where the figure belongs. Never invent the figure.
4. Write ATS-friendly plain text: no markdown, no bullet characters, no emojis, no tables. Start bullets with a strong past-tense verb (present tense for current roles), keep each bullet concise (at most 2 lines, about 200 characters), and keep the existing tone and spelling.
5. Never change contact.email, contact.github, contact.linkedin or contact.website.
6. Suggest only edits that clearly serve the request, at most ${MAX_SUGGESTIONS}. Return the full replacement text for a field in "after" and one short sentence in "reason". Skip fields that are already fine. If nothing should change, return no suggestions and explain in "message".
7. "message" is a one or two sentence reply to the student: what you changed, or why you changed nothing.`

export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: { type: 'STRING' },
    suggestions: {
      type: 'ARRAY',
      maxItems: MAX_SUGGESTIONS,
      items: {
        type: 'OBJECT',
        properties: {
          path: { type: 'STRING' },
          after: { type: 'STRING' },
          reason: { type: 'STRING' },
        },
        required: ['path', 'after', 'reason'],
        propertyOrdering: ['path', 'after', 'reason'],
      },
    },
  },
  required: ['message', 'suggestions'],
  propertyOrdering: ['message', 'suggestions'],
}

const line = (f: FieldInfo) => `${f.path}: ${f.value.replace(/\s*\n\s*/g, ' ').trim() || '(empty)'}`

export function buildAssistantPrompt(input: {
  content: ResumeContent
  prompt: string
  focusBlock?: string
  about?: string[]
  jobDescription?: string
}): { system: string; prompt: string; schema: object } {
  const { content, focusBlock } = input
  const all = allTextFields(content)
  const editable = focusBlock ? fieldsOf(content, focusBlock) : all
  const editablePaths = new Set(editable.map((f) => f.path))
  const context = all.filter((f) => !editablePaths.has(f.path))

  const parts: string[] = []
  parts.push(`EDITABLE FIELDS (path: current text)\n${editable.length ? editable.map(line).join('\n') : '(none)'}`)
  if (context.length) parts.push(`READ-ONLY CONTEXT (do not edit)\n${context.map(line).join('\n')}`)
  const about = (input.about ?? []).map((a) => a.trim()).filter(Boolean)
  if (about.length)
    parts.push(
      `ABOUT YOU (the student's own descriptions; extra facts you may use)\n${about.map((a, i) => `[${i + 1}] ${a}`).join('\n\n')}`,
    )
  const jd = input.jobDescription?.trim()
  if (jd) parts.push(`JOB DESCRIPTION (for targeting only; never claim its requirements as experience)\n${jd}`)
  parts.push(`STUDENT'S REQUEST\n${input.prompt.trim()}`)

  return { system: SYSTEM, prompt: parts.join('\n\n'), schema: RESPONSE_SCHEMA }
}

/** The paths the assistant may edit: one block when focused, otherwise every text field. */
export function editablePaths(content: ResumeContent, focusBlock?: string): string[] {
  return (focusBlock ? fieldsOf(content, focusBlock) : allTextFields(content)).map((f) => f.path)
}

/** Plain text only: no markdown emphasis, list markers or backticks. */
function stripMarkdown(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•]\s+/, ''))
    .join('\n')
    .replace(/\*\*|__/g, '')
    .replace(/`/g, '')
    .trim()
}

export function validateSuggestions(
  content: ResumeContent,
  raw: unknown,
  allowedPaths?: string[],
): { message: string; suggestions: Suggestion[] } {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const message = typeof obj.message === 'string' ? obj.message.trim() : ''
  const list = Array.isArray(obj.suggestions) ? obj.suggestions : []
  const allowed = allowedPaths ? new Set(allowedPaths) : null
  const seen = new Set<string>()
  const suggestions: Suggestion[] = []

  for (const item of list) {
    if (suggestions.length >= MAX_SUGGESTIONS) break
    if (!item || typeof item !== 'object') continue
    const s = item as Record<string, unknown>
    if (typeof s.path !== 'string' || typeof s.after !== 'string') continue
    const path = s.path.trim()
    if (seen.has(path) || LINK_FIELDS.has(path) || (allowed && !allowed.has(path))) continue
    const before = getAt(content, path)
    if (before === undefined) continue
    const after = stripMarkdown(s.after)
    if (!after || after === before.trim() || after.length > MAX_AFTER) continue
    seen.add(path)
    suggestions.push({ path, before, after, reason: stripMarkdown(typeof s.reason === 'string' ? s.reason : '') })
  }
  return { message, suggestions }
}
