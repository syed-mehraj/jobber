'use server'

import { and, eq, isNull, ne } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { getDb } from '@/db'
import { invites, users } from '@/db/schema'
import { createInvite, isEmail, normalizeEmail } from '@/lib/auth/invites'
import { requireAdmin } from '@/lib/auth/session'
import { siteUrl } from '@/lib/site-url'

export type InviteResult = { ok: true; email: string; link: string } | { ok: false; error: string }

/** Creates an invite and returns its link. The link is shown once; only a hash of its token is stored. */
export async function inviteSomeone(_prev: InviteResult | null, form: FormData): Promise<InviteResult> {
  const admin = await requireAdmin()
  const email = normalizeEmail(String(form.get('email') ?? ''))
  if (!isEmail(email)) return { ok: false, error: 'Enter a valid email address.' }
  const db = await getDb()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing) return { ok: false, error: 'This person already has an account.' }
  // A new link replaces any older open one for the same email.
  await db.delete(invites).where(and(eq(invites.email, email), isNull(invites.usedAt)))
  const { token } = await createInvite(db, email, admin.id)
  refresh()
  return { ok: true, email, link: `${await siteUrl()}/signup?invite=${encodeURIComponent(token)}` }
}

export async function revokeInvite(id: number): Promise<void> {
  await requireAdmin()
  if (!Number.isInteger(id)) return
  const db = await getDb()
  await db.delete(invites).where(and(eq(invites.id, id), isNull(invites.usedAt)))
  refresh()
}

/** Removes someone's account and everything that belongs to it. The admin can't remove themselves. */
export async function removePerson(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (typeof id !== 'string' || !id || id === admin.id) return
  const db = await getDb()
  await db.delete(users).where(and(eq(users.id, id), ne(users.role, 'admin')))
  refresh()
}
