import { and, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { jobMatches, jobs, profiles, runs, sources, users } from '@/db/schema'
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

  it("stores the skills a posting asks for, and each person's matched and missing skills", async () => {
    await db.insert(users).values({ id: 'u1', name: 'U One', email: 'u1@example.com' })
    await db.insert(profiles).values({ userId: 'u1', skills: ['python', 'react'], preferred: [] })
    board = [
      {
        ...posting('a', 'Software Engineering Intern'),
        description: 'Python, React, Rust and Kubernetes. 0-1 years of experience.',
      },
    ]
    await runSearch(db, 'manual', { adapters: fake, now })
    const [job] = await db.select().from(jobs)
    expect(job.required).toEqual(['python', 'react', 'rust', 'kubernetes'])
    const [m] = await db.select().from(jobMatches)
    expect(m).toMatchObject({
      userId: 'u1',
      jobId: job.id,
      matched: ['python', 'react'],
      missing: ['rust', 'kubernetes'],
    })

    // A later run refreshes them when the posting changes.
    clock = new Date('2026-11-16T07:00:00Z')
    board = [{ ...board[0], description: 'Python and Rust. 0-1 years of experience.' }]
    await runSearch(db, 'refresh', { adapters: fake, now })
    const [again] = await db.select().from(jobs)
    expect(again.required).toEqual(['python', 'rust'])
    const [m2] = await db.select().from(jobMatches)
    expect(m2.missing).toEqual(['rust'])
  })

  it("keeps a person's dismissal when later runs see (and rescore) the job again", async () => {
    await db.insert(users).values([
      { id: 'u1', name: 'U One', email: 'u1@example.com' },
      { id: 'u2', name: 'U Two', email: 'u2@example.com' },
    ])
    board = [posting('a', 'Software Engineering Intern'), posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'manual', { adapters: fake, now })
    const dismissedAt = new Date('2026-11-16T06:30:00Z')
    const [jobA] = await db.select().from(jobs).where(eq(jobs.externalId, 'a'))
    await db
      .update(jobMatches)
      .set({ dismissedAt })
      .where(and(eq(jobMatches.jobId, jobA.id), eq(jobMatches.userId, 'u1')))
    const dismissedFor = async (userId: string, externalId: string) => {
      const [j] = await db.select().from(jobs).where(eq(jobs.externalId, externalId))
      const [m] = await db
        .select()
        .from(jobMatches)
        .where(and(eq(jobMatches.jobId, j.id), eq(jobMatches.userId, userId)))
      return m?.dismissedAt?.toISOString() ?? null
    }

    clock = new Date('2026-11-16T07:00:00Z')
    board = [posting('a', 'Software Engineering Intern (Backend)')]
    await runSearch(db, 'refresh', { adapters: fake, now })
    const byId = Object.fromEntries((await db.select().from(jobs)).map((r) => [r.externalId, r]))
    expect(byId.a.title).toBe('Software Engineering Intern (Backend)')
    expect(await dismissedFor('u1', 'a')).toBe(dismissedAt.toISOString())
    expect(await dismissedFor('u1', 'c')).toBeNull()
    // Only the person who dismissed it.
    expect(await dismissedFor('u2', 'a')).toBeNull()

    // Even after it closes and comes back, it stays dismissed.
    clock = new Date('2026-11-16T08:00:00Z')
    board = [posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'refresh', { adapters: fake, now })
    clock = new Date('2026-11-16T09:00:00Z')
    board = [posting('a', 'Software Engineering Intern (Backend)'), posting('c', 'Graduate ML Engineer')]
    await runSearch(db, 'refresh', { adapters: fake, now })
    const [a] = await db.select().from(jobs).where(eq(jobs.externalId, 'a'))
    expect(a.closedAt).toBeNull()
    expect(await dismissedFor('u1', 'a')).toBe(dismissedAt.toISOString())
  })

  it('does not start a second run while one is going', async () => {
    await db.insert(runs).values({ trigger: 'refresh', startedAt: new Date('2026-11-16T05:58:00Z') })
    expect(await runSearch(db, 'manual', { adapters: fake, now })).toBeNull()
  })
})

describe('loadProfile', () => {
  it('adds every known skill found anywhere in the master resume', async () => {
    const { loadProfile, resumeText } = await import('./matches')
    const db = await createTestDb()
    await db.insert(users).values({ id: 'u1', name: 'U One', email: 'u1@example.com' })
    await db.insert((await import('@/db/schema')).resumes).values({
      userId: 'u1',
      name: 'Master resume',
      isMaster: true,
      content: {
        summary: { text: 'AI student building RAG pipelines with LangChain.' },
        projects: [{ stack: 'TODO', bullets: [{ text: 'Deployed on Kubernetes with Docker.' }] }],
      },
    })
    const profile = await loadProfile(db, 'u1')
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
    const { loadProfile } = await import('./matches')
    const { abouts } = await import('@/db/schema')
    const db = await createTestDb()
    await db.insert(users).values({ id: 'u1', name: 'U One', email: 'u1@example.com' })
    await db.insert(abouts).values([
      { userId: 'u1', title: 'General', text: 'I build services and debug distributed systems with Kubernetes.' },
      {
        userId: 'u1',
        title: 'Admin roles',
        text: 'I deploy with Terraform daily. While I haven’t directly administered Salesforce or SAP, I learn fast.',
      },
    ])
    const profile = await loadProfile(db, 'u1')
    // Neither skill is in the default profile, so these can only come from the descriptions.
    expect(profile.skills).toEqual(expect.arrayContaining(['kubernetes', 'terraform']))
    expect(profile.skills).not.toContain('salesforce')
  })
})

describe('per-person scores', () => {
  it("scores the same job for each person against their own skills, and only one person's on request", async () => {
    const { rescore, needsScores } = await import('./matches')
    const db = await createTestDb()
    await db.insert(sources).values({ key: 'fake:acme', kind: 'fake', name: 'Acme', config: {} })
    await db.insert(users).values([
      { id: 'py', name: 'Py Person', email: 'py@example.com' },
      { id: 'go', name: 'Go Person', email: 'go@example.com' },
    ])
    await db.insert(profiles).values([
      { userId: 'py', skills: ['python', 'react', 'postgres'], preferred: [] },
      { userId: 'go', skills: ['go'], preferred: [] },
    ])
    const job = {
      ...posting('a', 'Software Engineering Intern'),
      description: 'Python, React and PostgreSQL. 0-1 years.',
    }
    await runSearch(db, 'manual', {
      adapters: { fake: async () => [job] },
      now: () => new Date('2026-11-16T06:00:00Z'),
    })
    const scores = Object.fromEntries((await db.select().from(jobMatches)).map((m) => [m.userId, m]))
    expect(scores.py.score).toBeGreaterThan(scores.go.score)
    expect(scores.py.missing).toEqual([])
    expect(scores.go.matched).toEqual([])

    // A new person has no scores until rescored; rescoring them touches no one else's rows.
    await db.insert(users).values({ id: 'new', name: 'New Person', email: 'new@example.com' })
    expect(await needsScores(db, 'new')).toBe(true)
    const before = scores.py.updatedAt.getTime()
    await rescore(db, { userIds: ['new'], now: new Date('2026-11-17T00:00:00Z') })
    expect(await needsScores(db, 'new')).toBe(false)
    const [py] = await db.select().from(jobMatches).where(eq(jobMatches.userId, 'py'))
    expect(py.updatedAt.getTime()).toBe(before)
  })
})
