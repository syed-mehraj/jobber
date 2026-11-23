import { and, eq, lt, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { aiUsage, type Role } from '@/db/schema'

/** AI requests a day per person (the Gemini key is the owner's, shared by everyone). */
export const AI_DAILY_LIMIT: Record<Role, number> = { user: 30, admin: 200 }

/** Today's date in India, YYYY-MM-DD. The limit resets at midnight IST. */
export function istDay(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3600000).toISOString().slice(0, 10)
}

/**
 * Takes one AI request from today's allowance. Returns false (and counts nothing) when it's used up.
 * One atomic statement, so parallel requests can't go over the limit.
 */
export async function takeAiRequest(db: DB, userId: string, role: Role, now = new Date()): Promise<boolean> {
  const limit = AI_DAILY_LIMIT[role]
  const day = istDay(now)
  const rows = await db
    .insert(aiUsage)
    .values({ userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
      setWhere: lt(aiUsage.count, limit),
    })
    .returning({ count: aiUsage.count })
  return rows.length > 0
}

/** Requests left today. */
export async function aiRequestsLeft(db: DB, userId: string, role: Role, now = new Date()): Promise<number> {
  const [row] = await db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, istDay(now))))
  return Math.max(0, AI_DAILY_LIMIT[role] - (row?.count ?? 0))
}
