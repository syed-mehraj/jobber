import type { DB } from '@/db'
import type { Role } from '@/db/schema'
import { markInvitesUsed } from './invites'

export type NewAccount = { id: string; email: string; role: Role }

/** Runs once, right after an account is created. */
export async function onAccountCreated(db: DB, user: NewAccount): Promise<void> {
  await markInvitesUsed(db, user.email, user.id)
}
