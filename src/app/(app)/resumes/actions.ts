'use server'

import { and, eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { resumes } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import { toDesign } from '@/resume/design'
import { blankResume } from '@/resume/edit-ops'
import { masterResume } from '@/resume/master'
import { toContent, type ResumeContent } from '@/resume/types'

const NAME_MAX = 120

export type CreateState = { error?: string }

/** New resume: a copy of the master (or of another version), or a blank one with your contact details. */
export async function createResume(_prev: CreateState, form: FormData): Promise<CreateState> {
  await requireUser()
  const name = String(form.get('name') ?? '').trim()
  const target = String(form.get('target') ?? '').trim()
  const from = String(form.get('from') ?? 'master')
  if (!name) return { error: 'Give it a name, e.g. "Backend SDE – Razorpay".' }
  if (name.length > NAME_MAX || target.length > NAME_MAX) return { error: `Keep names under ${NAME_MAX} characters.` }

  const db = await getDb()
  const all = await db.select().from(resumes)
  const master = all.find((r) => r.isMaster)
  const masterContent = toContent(master?.content) ?? masterResume

  let content: ResumeContent
  let design: unknown = master?.design ?? {}
  if (from === 'blank') content = blankResume(masterContent)
  else if (from === 'master') content = structuredClone(masterContent)
  else {
    const source = all.find((r) => String(r.id) === from)
    const sourceContent = toContent(source?.content)
    if (!source || !sourceContent) return { error: 'That resume could not be copied.' }
    content = structuredClone(sourceContent)
    design = source.design
  }

  const [row] = await db
    .insert(resumes)
    .values({
      name: name.slice(0, NAME_MAX),
      target: target || null,
      isMaster: false,
      content,
      design: toDesign(design),
    })
    .returning({ id: resumes.id })
  redirect(`/resumes/${row.id}/edit`)
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string }

/** Autosave from the editor. */
export async function saveResume(
  id: number,
  input: { content: unknown; design: unknown; name: string; target: string },
): Promise<SaveResult> {
  await requireUser()
  if (!Number.isInteger(id)) return { ok: false, error: 'Not found.' }
  const content = toContent(input.content)
  if (!content) return { ok: false, error: 'The resume data is not valid.' }
  const name = String(input.name ?? '')
    .trim()
    .slice(0, NAME_MAX)
  if (!name) return { ok: false, error: 'The resume needs a name.' }
  if (JSON.stringify(content).length > 200_000) return { ok: false, error: 'The resume is too large to save.' }
  const db = await getDb()
  const now = new Date()
  const updated = await db
    .update(resumes)
    .set({
      content,
      design: toDesign(input.design),
      name,
      target:
        String(input.target ?? '')
          .trim()
          .slice(0, NAME_MAX) || null,
      updatedAt: now,
    })
    .where(eq(resumes.id, id))
    .returning({ id: resumes.id })
  if (!updated.length) return { ok: false, error: 'Not found.' }
  return { ok: true, savedAt: now.toISOString() }
}

/** Deletes a version. The master resume can't be deleted. */
export async function deleteResume(id: number): Promise<void> {
  await requireUser()
  if (!Number.isInteger(id)) return
  const db = await getDb()
  await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.isMaster, false)))
  refresh()
  redirect('/resumes')
}
