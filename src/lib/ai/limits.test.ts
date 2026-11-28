import { describe, expect, it } from 'vitest'
import { users } from '@/db/schema'
import { createTestDb } from '@/db/testing'
import { AI_DAILY_LIMIT, aiRequestsLeft, istDay, takeAiRequest, takeBurst } from './limits'

describe('AI daily limit', () => {
  it('allows the daily number per person, then refuses until midnight in India', async () => {
    const db = await createTestDb()
    await db.insert(users).values([
      { id: 'a', name: 'A', email: 'a@example.com' },
      { id: 'b', name: 'B', email: 'b@example.com' },
    ])
    const day1 = new Date('2026-11-23T10:00:00Z')
    const results = await Promise.all(
      Array.from({ length: AI_DAILY_LIMIT.user + 5 }, () => takeAiRequest(db, 'a', 'user', day1)),
    )
    expect(results.filter(Boolean)).toHaveLength(AI_DAILY_LIMIT.user)
    expect(await aiRequestsLeft(db, 'a', 'user', day1)).toBe(0)
    // Someone else's allowance is untouched.
    expect(await takeAiRequest(db, 'b', 'user', day1)).toBe(true)
    // 18:30 UTC is midnight in India: a new day.
    const day2 = new Date('2026-11-23T18:31:00Z')
    expect(istDay(day2)).toBe('2026-11-24')
    expect(await takeAiRequest(db, 'a', 'user', day2)).toBe(true)
    expect(await aiRequestsLeft(db, 'a', 'admin', day2)).toBe(AI_DAILY_LIMIT.admin - 1)
  })
})

describe('AI burst limit', () => {
  it('allows the limit within the window, then refuses, per person, and recovers as the window passes', () => {
    const t0 = 1_000_000
    for (let i = 0; i < 3; i++) expect(takeBurst('burst-a', 3, 60_000, t0 + i)).toBe(true)
    expect(takeBurst('burst-a', 3, 60_000, t0 + 10)).toBe(false)
    expect(takeBurst('burst-b', 3, 60_000, t0 + 10)).toBe(true)
    expect(takeBurst('burst-a', 3, 60_000, t0 + 61_000)).toBe(true)
  })
})
