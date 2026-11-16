import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { jobs, runs, sources } from '@/db/schema'
import { createTestDb } from '@/db/testing'
import { runSearch } from './run'
import type { Adapter, RawPosting } from './types'

const posting = (id: string, title: string, location = 'Bengaluru'): RawPosting => ({
  externalId: id,
  company: 'Acme',
  title,
  location,
  url: `https://example.com/${id}`,
  postedAt: new Date('2026-11-15T00:00:00Z'),
  description: 'Python, React and PostgreSQL. 0-1 years of experience.',
})

describe('runSearch', () => {
  let db: DB
  let board: RawPosting[]
  const fake: Record<string, Adapter> = {
    fake: async () => board,
    broken: async () => {
      throw new Error('HTTP 500 from example.com')
    },
  }
  let clock = new Date('2026-11-16T06:00:00Z')
  const now = () => clock

  beforeEach(async () => {
    db = await createTestDb()
    await db.insert(sources).values([
      { key: 'fake:acme', kind: 'fake', name: 'Acme', config: {} },
      { key: 'broken:x', kind: 'broken', name: 'Broken Co', config: {} },
    ])
    clock = new Date('2026-11-16T06:00:00Z')
  })

  it('stores what passes the filters, counts new jobs, and keeps going when a source fails', async () => {
    board = [
      posting('a', 'Software Engineering Intern'),
      posting('b', 'Senior Software Engineer'),
      posting('c', 'Graduate ML Engineer', 'Hyderabad'),
    ]
    const summary = await runSearch(db, 'manual', { adapters: fake, now })
    expect(summary).toMatchObject({ sourcesOk: 1, sourcesFailed: 1, seen: 3, kept: 2, added: 2, closed: 0 })

    const stored = await db.select().from(jobs)
    expect(stored.map((j) => j.title).sort()).toEqual(['Graduate ML Engineer', 'Software Engineering Intern'])
    expect(stored.every((j) => j.score > 0 && j.score < 100)).toBe(true)

    const [broken] = await db.select().from(sources).where(eq(sources.key, 'broken:x'))
    expect(broken.lastError).toContain('HTTP 500')
    const [run] = await db.select().from(runs)
    expect(run.finishedAt).not.toBeNull()
    expect(run.errors).toEqual([{ source: 'Broken Co', error: 'HTTP 500 from example.com' }])
  })

  it('updates existing jobs, adds new ones and closes the ones taken down', async () => {
    board = [posting('a', 'Software Engineering Intern'), posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'manual', { adapters: fake, now })

    clock = new Date('2026-11-16T07:00:00Z')
    board = [posting('a', 'Software Engineering Intern (Backend)'), posting('d', 'Junior Developer')]
    const summary = await runSearch(db, 'refresh', { adapters: fake, now })
    expect(summary).toMatchObject({ kept: 2, added: 1, closed: 1 })

    const rows = await db.select().from(jobs)
    const byId = Object.fromEntries(rows.map((r) => [r.externalId, r]))
    expect(byId.a.title).toBe('Software Engineering Intern (Backend)')
    expect(byId.a.firstSeenAt.toISOString()).toBe('2026-11-16T06:00:00.000Z')
    expect(byId.c.closedAt?.toISOString()).toBe('2026-11-16T07:00:00.000Z')
    expect(byId.d.closedAt).toBeNull()
  })

  it('does not start a second run while one is going', async () => {
    await db.insert(runs).values({ trigger: 'refresh', startedAt: new Date('2026-11-16T05:58:00Z') })
    expect(await runSearch(db, 'manual', { adapters: fake, now })).toBeNull()
  })
})
