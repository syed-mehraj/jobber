import { and, eq, ne } from 'drizzle-orm'
import type { DB } from '@/db'
import type { Auth } from './auth'
import { sessions, users } from '@/db/schema'
import { signupGate } from './gate'
import { normalizeEmail } from './invites'

/*
 * The owner (the only admin) is set in the environment, not in the app:
 * - OWNER_EMAIL: the owner's email. Only this account is ever treated as admin.
 * - OWNER_PASSWORD_HASH: Better Auth's scrypt hash of the owner's password (never the password itself).
 * - OWNER_NAME: optional display name.
 * When the app starts, ensureOwner() creates that account (moving everything stored before accounts into it),
 * or brings it in line with the environment: admin role, and the password from OWNER_PASSWORD_HASH.
 * Changing the hash signs the owner out everywhere.
 */

export function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL?.trim()
  return raw ? normalizeEmail(raw) : null
}

/** True only for the owner's email, and false for everyone when OWNER_EMAIL isn't set. */
export function isOwnerEmail(email: string): boolean {
  const owner = ownerEmail()
  return owner !== null && normalizeEmail(email) === owner
}

/** Better Auth stores scrypt hashes as "<salt hex>:<key hex>". */
const looksLikeHash = (h: string) => /^[0-9a-f]{32}:[0-9a-f]{128}$/.test(h)

type AuthContext = Awaited<Auth['$context']>

export type OwnerResult = 'not-configured' | 'created' | 'password-updated' | 'unchanged'

export async function ensureOwner(db: DB, ctx: AuthContext): Promise<OwnerResult> {
  const email = ownerEmail()
  const hash = process.env.OWNER_PASSWORD_HASH?.trim()
  if (!email || !hash) return 'not-configured'
  if (!looksLikeHash(hash)) {
    console.error('[owner] OWNER_PASSWORD_HASH is not a Better Auth password hash; the owner was not set up.')
    return 'not-configured'
  }

  // Only the owner is admin: anyone else marked admin (e.g. after OWNER_EMAIL changed) becomes a normal user.
  await db
    .update(users)
    .set({ role: 'user' })
    .where(and(eq(users.role, 'admin'), ne(users.email, email)))

  const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email))
  if (!existing) {
    const name = process.env.OWNER_NAME?.trim() || email.split('@')[0]
    const created = await signupGate.run({ email, role: 'admin' }, () =>
      ctx.internalAdapter.createUser({ name, email, emailVerified: true }, { method: 'email-password' }),
    )
    if (!created) throw new Error('[owner] the owner account could not be created')
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: 'credential',
      accountId: created.id,
      password: hash,
    })
    return 'created'
  }

  if (existing.role !== 'admin') await db.update(users).set({ role: 'admin' }).where(eq(users.id, existing.id))
  const credential = (await ctx.internalAdapter.findAccounts(existing.id)).find((a) => a.providerId === 'credential')
  if (!credential) {
    await ctx.internalAdapter.linkAccount({
      userId: existing.id,
      providerId: 'credential',
      accountId: existing.id,
      password: hash,
    })
    return 'password-updated'
  }
  if (credential.password === hash) return 'unchanged'
  await ctx.internalAdapter.updatePassword(existing.id, hash)
  await db.delete(sessions).where(eq(sessions.userId, existing.id))
  return 'password-updated'
}
