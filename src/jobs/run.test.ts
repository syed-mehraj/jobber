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

  it('stores the skills a posting asks for and the ones the profile lacks', async () => {
    board = [
      {
        ...posting('a', 'Software Engineering Intern'),
        description: 'Python, React, Rust and Kubernetes. 0-1 years of experience.',
      },
    ]
    await runSearch(db, 'manual', { adapters: fake, now })
    const [job] = await db.select().from(jobs)
    expect(job.required).toEqual(['python', 'react', 'rust', 'kubernetes'])
    expect(job.matched).toEqual(['python', 'react'])
    expect(job.missing).toEqual(['rust', 'kubernetes'])

    // A later run refreshes them when the posting changes.
    clock = new Date('2026-11-16T07:00:00Z')
    board = [{ ...board[0], description: 'Python and Rust. 0-1 years of experience.' }]
    await runSearch(db, 'refresh', { adapters: fake, now })
    const [again] = await db.select().from(jobs)
    expect(again.required).toEqual(['python', 'rust'])
    expect(again.missing).toEqual(['rust'])
  })

  it('keeps a dismissed job dismissed when a later run sees it again', async () => {
    board = [posting('a', 'Software Engineering Intern'), posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'manual', { adapters: fake, now })
    const dismissedAt = new Date('2026-11-16T06:30:00Z')
    await db.update(jobs).set({ dismissedAt }).where(eq(jobs.externalId, 'a'))

    clock = new Date('2026-11-16T07:00:00Z')
    board = [posting('a', 'Software Engineering Intern (Backend)')]
    await runSearch(db, 'refresh', { adapters: fake, now })
    const byId = Object.fromEntries((await db.select().from(jobs)).map((r) => [r.externalId, r]))
    expect(byId.a.title).toBe('Software Engineering Intern (Backend)')
    expect(byId.a.dismissedAt?.toISOString()).toBe(dismissedAt.toISOString())
    expect(byId.c.dismissedAt).toBeNull()

    // Even after it closes and comes back, it stays dismissed.
    clock = new Date('2026-11-16T08:00:00Z')
    board = [posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'refresh', { adapters: fake, now })
    clock = new Date('2026-11-16T09:00:00Z')
    board = [posting('a', 'Software Engineering Intern (Backend)'), posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'refresh', { adapters: fake, now })
    const [a] = await db.select().from(jobs).where(eq(jobs.externalId, 'a'))
    expect(a.closedAt).toBeNull()
    expect(a.dismissedAt?.toISOString()).toBe(dismissedAt.toISOString())
  })

  it('does not start a second run while one is going', async () => {
    await db.insert(runs).values({ trigger: 'refresh', startedAt: new Date('2026-11-16T05:58:00Z') })
    expect(await runSearch(db, 'manual', { adapters: fake, now })).toBeNull()
  })
})

describe('loadProfile', () => {
  it('adds every known skill found anywhere in the master resume', async () => {
    const { loadProfile, resumeText } = await import('./run')
    const db = await createTestDb()
    await db.insert((await import('@/db/schema')).resumes).values({
      name: 'Master resume',
      isMaster: true,
      content: {
        summary: { text: 'AI student building RAG pipelines with LangChain.' },
        projects: [{ stack: 'TODO', bullets: [{ text: 'Deployed on Kubernetes with Docker.' }] }],
      },
    })
    const profile = await loadProfile(db)
    for (const s of ['artificial intelligence', 'rag', 'kubernetes', 'docker']) expect(profile.skills).toContain(s)
    expect(resumeText({ a: 'TODO', b: ['x', { c: 'y' }] })).toBe('x\ny')
  })
})

describe('unofficial sources', () => {
  it('are read at most once an hour', async () => {
    const db = await createTestDb()
    await db.insert(sources).values({ key: 'unofficial:amazon', kind: 'amazon', name: 'Amazon', config: {} })
    let calls = 0
    const fakeAmazon = {
      amazon: async () => {
        calls++
        return [posting('a1', 'Software Development Engineer I')]
      },
    }
    let t = new Date('2026-11-16T06:00:00Z')
    await runSearch(db, 'manual', { adapters: fakeAmazon, now: () => t })
    t = new Date('2026-11-16T06:30:00Z')
    await runSearch(db, 'manual', { adapters: fakeAmazon, now: () => t })
    expect(calls).toBe(1)
    t = new Date('2026-11-16T07:01:00Z')
    await runSearch(db, 'manual', { adapters: fakeAmazon, now: () => t })
    expect(calls).toBe(2)
  })
})

describe('duplicates', () => {
  it('keeps one posting per title and location within a source', async () => {
    const db = await createTestDb()
    await db.insert(sources).values({ key: 'fake:dupe', kind: 'fake', name: 'Acme', config: {} })
    const twice = [posting('d1', 'Software Development Engineer I'), posting('d2', 'Software Development Engineer I')]
    const summary = await runSearch(db, 'manual', { adapters: { fake: async () => twice } })
    expect(summary?.kept).toBe(1)
  })
})

describe('loadProfile with About you', () => {
  it('counts skills from every description but not the ones they say you have not used', async () => {
    const { loadProfile } = await import('./run')
    const { abouts } = await import('@/db/schema')
    const db = await createTestDb()
    await db.insert(abouts).values([
      { title: 'General', text: 'I build services and debug distributed systems with Kubernetes.' },
      {
        title: 'Admin roles',
        text: 'I deploy with Terraform daily. While I haven’t directly administered Salesforce or SAP, I learn fast.',
      },
    ])
    const profile = await loadProfile(db)
    // Neither skill is in the default profile, so these can only come from the descriptions.
    expect(profile.skills).toEqual(expect.arrayContaining(['kubernetes', 'terraform']))
    expect(profile.skills).not.toContain('salesforce')
  })
})
