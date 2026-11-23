'use server'

import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { resumeFiles, resumes } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import { defaultDesign } from '@/resume/design'
import { aiParseResume } from '@/resume/import/ai-parse'
import { extractText, UnsupportedFileError } from '@/resume/import/extract'
import { parseResumeText } from '@/resume/import/parse'

export type UploadState = { error?: string }

const MAX_BYTES = 5 * 1024 * 1024

/**
 * Upload a resume (PDF, Word .docx or text). The original file is stored, and its text is read into an
 * editable resume (with Gemini when a key is set, otherwise with the built-in parser).
 * mode "edit" opens the editor; mode "save" returns to the Resumes list.
 */
export async function uploadResume(_prev: UploadState, form: FormData): Promise<UploadState> {
  const user = await requireUser()
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file to upload.' }
  if (file.size > MAX_BYTES) return { error: 'The file is larger than 5 MB.' }
  const mode = form.get('mode') === 'save' ? 'save' : 'edit'
  const target = String(form.get('target') ?? '')
    .trim()
    .slice(0, 120)
  const name =
    String(form.get('name') ?? '')
      .trim()
      .slice(0, 120) || file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 120)

  const bytes = new Uint8Array(await file.arrayBuffer())
  let text: string
  try {
    text = await extractText({ name: file.name, type: file.type, bytes })
  } catch (e) {
    if (e instanceof UnsupportedFileError) return { error: e.message }
    return { error: 'That file could not be read. If it is a scanned image, upload a text-based PDF or a Word file.' }
  }
  if (text.trim().length < 40) {
    return {
      error: 'No text was found in that file. If it is a scanned image, upload a text-based PDF or a Word file.',
    }
  }

  const content = (await aiParseResume(text)) ?? parseResumeText(text).content

  const db = await getDb()
  const [row] = await db
    .insert(resumes)
    .values({ userId: user.id, name, target: target || null, isMaster: false, content, design: defaultDesign })
    .returning({ id: resumes.id })
  await db.insert(resumeFiles).values({
    userId: user.id,
    resumeId: row.id,
    name: file.name.slice(0, 200),
    mime: file.type || 'application/octet-stream',
    size: file.size,
    data: bytes,
  })
  redirect(mode === 'edit' ? `/resumes/${row.id}/edit?imported=1` : '/resumes')
}
