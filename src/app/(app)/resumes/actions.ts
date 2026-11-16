'use server'

import { sql } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { requireSession } from '@/lib/auth/session'
import { ABOUT_MAX } from '@/resume/about'

export async function saveAbout(text: string): Promise<{ ok: boolean; error?: string }> {
  await requireSession()
  const value = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (value.length > ABOUT_MAX) return { ok: false, error: `Keep it under ${ABOUT_MAX} characters.` }
  const db = await getDb()
  await db
    .insert(settings)
    .values({ key: 'about', value: { text: value } })
    .onConflictDoUpdate({ target: settings.key, set: { value: { text: value }, updatedAt: sql`now()` } })
  refresh()
  return { ok: true }
}
