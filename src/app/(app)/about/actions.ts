'use server'

import { and, eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { getDb } from '@/db'
import { abouts } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import { ABOUT_MAX, ABOUT_TITLE_MAX } from '@/resume/about'

export type AboutInput = { title: string; target: string; text: string }
export type AboutResult = { ok: boolean; error?: string; id?: number }

function clean(input: AboutInput): { value?: { title: string; target: string | null; text: string }; error?: string } {
  const title = String(input.title ?? '').trim()
  const target = String(input.target ?? '').trim()
  const text = String(input.text ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (!title) return { error: 'Give it a short title, e.g. "AI Engineer roles".' }
  if (title.length > ABOUT_TITLE_MAX) return { error: `Keep the title under ${ABOUT_TITLE_MAX} characters.` }
  if (!text) return { error: 'Write the description.' }
  if (text.length > ABOUT_MAX) return { error: `Keep it under ${ABOUT_MAX} characters.` }
  return { value: { title, target: target ? target.slice(0, ABOUT_TITLE_MAX) : null, text } }
}

export async function createAbout(input: AboutInput): Promise<AboutResult> {
  const user = await requireUser()
  const { value, error } = clean(input)
  if (!value) return { ok: false, error }
  const db = await getDb()
  const [row] = await db
    .insert(abouts)
    .values({ ...value, userId: user.id })
    .returning({ id: abouts.id })
  refresh()
  return { ok: true, id: row.id }
}

export async function updateAbout(id: number, input: AboutInput): Promise<AboutResult> {
  const user = await requireUser()
  if (!Number.isInteger(id)) return { ok: false, error: 'Not found.' }
  const { value, error } = clean(input)
  if (!value) return { ok: false, error }
  const db = await getDb()
  const updated = await db
    .update(abouts)
    .set({ ...value, updatedAt: new Date() })
    .where(and(eq(abouts.id, id), eq(abouts.userId, user.id)))
    .returning({ id: abouts.id })
  if (!updated.length) return { ok: false, error: 'Not found.' }
  refresh()
  return { ok: true, id }
}

export async function duplicateAbout(id: number): Promise<AboutResult> {
  const user = await requireUser()
  if (!Number.isInteger(id)) return { ok: false, error: 'Not found.' }
  const db = await getDb()
  const [src] = await db
    .select()
    .from(abouts)
    .where(and(eq(abouts.id, id), eq(abouts.userId, user.id)))
  if (!src) return { ok: false, error: 'Not found.' }
  const [row] = await db
    .insert(abouts)
    .values({
      userId: user.id,
      title: `${src.title} (copy)`.slice(0, ABOUT_TITLE_MAX),
      target: src.target,
      text: src.text,
    })
    .returning({ id: abouts.id })
  refresh()
  return { ok: true, id: row.id }
}

export async function deleteAbout(id: number): Promise<AboutResult> {
  const user = await requireUser()
  if (!Number.isInteger(id)) return { ok: false, error: 'Not found.' }
  const db = await getDb()
  await db.delete(abouts).where(and(eq(abouts.id, id), eq(abouts.userId, user.id)))
  refresh()
  return { ok: true }
}
