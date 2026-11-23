import 'server-only'
import { and, asc, desc, eq, gt, isNull, sql } from 'drizzle-orm'
import { connection } from 'next/server'
import { getDb } from '@/db'
import { accounts, invites, users, type Role } from '@/db/schema'
import { requireAdmin } from '@/lib/auth/session'

export type Person = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
  /** "credential" (password) and/or "google". */
  methods: string[]
}

export type PendingInvite = { id: number; email: string; createdAt: Date; expiresAt: Date }

/** Everyone with an account, the admin first. Admin only. */
export async function getPeople(): Promise<Person[]> {
  await connection()
  await requireAdmin()
  const db = await getDb()
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      methods: sql<
        string[]
      >`coalesce(array_agg(distinct ${accounts.providerId}) filter (where ${accounts.providerId} is not null), '{}')`,
    })
    .from(users)
    .leftJoin(accounts, eq(accounts.userId, users.id))
    .groupBy(users.id)
    .orderBy(asc(sql`case when ${users.role} = 'admin' then 0 else 1 end`), asc(users.createdAt))
}

/** Invites not used yet and not expired. Admin only. */
export async function getPendingInvites(): Promise<PendingInvite[]> {
  await connection()
  await requireAdmin()
  const db = await getDb()
  return db
    .select({ id: invites.id, email: invites.email, createdAt: invites.createdAt, expiresAt: invites.expiresAt })
    .from(invites)
    .where(and(isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
    .orderBy(desc(invites.createdAt))
}
