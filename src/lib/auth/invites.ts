import { createHash, randomBytes } from 'node:crypto'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import type { DB } from '@/db'
import { invites } from '@/db/schema'

/** How long an invite link works. */
export const INVITE_DAYS = 14

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (email: string) => email.length <= 254 && EMAIL.test(email)

/** A new invite token (for the link) and the hash that is stored. */
export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashInviteToken(token) }
}

export const hashInviteToken = (token: string) => createHash('sha256').update(token).digest('hex')

export type OpenInvite = typeof invites.$inferSelect

/** The unused, unexpired invite a link's token belongs to, or null. */
export async function findInviteByToken(db: DB, token: string, now = new Date()): Promise<OpenInvite | null> {
  if (!token || token.length > 100) return null
  const [row] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.tokenHash, hashInviteToken(token)), isNull(invites.usedAt), gt(invites.expiresAt, now)))
    .limit(1)
  return row ?? null
}

/** The newest unused, unexpired invite for an email, or null. Google sign-in uses this: Google has proved the email. */
export async function findInviteByEmail(db: DB, email: string, now = new Date()): Promise<OpenInvite | null> {
  const [row] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.email, normalizeEmail(email)), isNull(invites.usedAt), gt(invites.expiresAt, now)))
    .orderBy(desc(invites.createdAt))
    .limit(1)
  return row ?? null
}

/** Creates an invite and returns the token for the link. The token itself is never stored. */
export async function createInvite(
  db: DB,
  email: string,
  createdBy: string | null,
  now = new Date(),
): Promise<{ id: number; token: string; expiresAt: Date }> {
  const { token, hash } = newInviteToken()
  const expiresAt = new Date(now.getTime() + INVITE_DAYS * 86400000)
  const [row] = await db
    .insert(invites)
    .values({ email: normalizeEmail(email), tokenHash: hash, createdBy, createdAt: now, expiresAt })
    .returning({ id: invites.id })
  return { id: row.id, token, expiresAt }
}

/** Marks every open invite for this email as used by the new account. */
export async function markInvitesUsed(db: DB, email: string, userId: string, now = new Date()): Promise<void> {
  await db
    .update(invites)
    .set({ usedAt: now, usedBy: userId })
    .where(and(eq(invites.email, normalizeEmail(email)), isNull(invites.usedAt)))
}
