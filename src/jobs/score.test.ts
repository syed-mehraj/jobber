import { describe, expect, it } from 'vitest'
import { defaultProfile, scoreJob, type Profile } from './score'
import type { RawPosting } from './types'

const now = new Date('2026-11-16T06:00:00Z')
const c = { level: 'new-grad', region: 'hyderabad', category: 'SDE' } as const
const posting = (description?: string, title = 'Software Engineer, New Grad'): RawPosting => ({
  externalId: 'x',
  company: 'Acme',
  title,
  location: 'Hyderabad',
  url: 'https://example.com/x',
  description,
})

/** Level 32 + location 15 + non-preferred category 8 = 55 before skills and freshness. */
const BASE = 55
const profile: Profile = { skills: ['python', 'JS', 'Postgres', 'k8s'], preferred: [] }

describe('scoreJob', () => {
  it('splits what the posting asks for into matched and missing, in canonical names', () => {
    const r = scoreJob(posting('Python, Go, Java and PostgreSQL. Kubernetes a plus.'), c, profile, now)
    expect(r.required).toEqual(['python', 'go', 'java', 'postgresql', 'kubernetes'])
    expect(r.matched).toEqual(['python', 'postgresql', 'kubernetes'])
    expect(r.missing).toEqual(['go', 'java'])
    expect(r.reasons).toContain('Mentions python, postgresql, kubernetes')
  })

  it('canonicalises profile skills, so aliases on either side line up', () => {
    const r = scoreJob(posting('We use JavaScript, PostgreSQL and k8s.'), c, profile, now)
    expect(r.matched).toEqual(['javascript', 'postgresql', 'kubernetes'])
    expect(r.missing).toEqual([])
  })

  it('scores by coverage when the posting lists three or more known skills', () => {
    // 2 of 4 required skills matched: 15 of 30.
    const half = scoreJob(posting('Python, Postgres, Java, Go.'), c, profile, now)
    expect(half.required).toHaveLength(4)
    expect(half.matched).toHaveLength(2)
    expect(half.score).toBe(BASE + 15)

    // Everything matched: the full 30, even though the old logic would have given 3 × 6 = 18.
    const full = scoreJob(posting('Python, JavaScript and PostgreSQL'), c, profile, now)
    expect(full.score).toBe(BASE + 30)

    // Nothing matched.
    const none = scoreJob(posting('Rust, Scala, Haskell, Elixir'), c, profile, now)
    expect(none.matched).toEqual([])
    expect(none.score).toBe(BASE)
  })

  it('a long wish-list the profile only partly covers scores below a short one it covers fully', () => {
    const long = scoreJob(
      posting('Python, Java, Go, Rust, Scala, Kotlin, Swift, Ruby, PHP, Perl, Postgres'),
      c,
      profile,
      now,
    )
    const short = scoreJob(posting('Python and Postgres'), c, profile, now)
    expect(long.score).toBeLessThan(short.score)
  })

  it('keeps the per-match logic (6 each) when fewer than three skills are listed', () => {
    const one = scoreJob(posting('Python is used here.'), c, profile, now)
    expect(one.score).toBe(BASE + 6)
    const two = scoreJob(posting('Python and Postgres.'), c, profile, now)
    expect(two.score).toBe(BASE + 12)
    const zero = scoreJob(posting('We make things people love.'), c, profile, now)
    expect(zero.required).toEqual([])
    expect(zero.score).toBe(BASE)
  })

  it('gives a neutral 10 when there is no description', () => {
    const r = scoreJob(posting(undefined), c, profile, now)
    expect(r.score).toBe(BASE + 10)
    expect(r.matched).toEqual([])
  })

  it('leaves the level, location, category and freshness weights alone', () => {
    const fresh = { ...posting('Nothing relevant here.'), postedAt: new Date('2026-11-15T12:00:00Z') }
    const r = scoreJob(fresh, c, { skills: [], preferred: ['SDE'] }, now)
    // 32 + 15 + 14 (preferred) + 0 skills + 8 (posted in the last 2 days)
    expect(r.score).toBe(69)
    expect(r.reasons).toEqual(['New-grad role', 'In Hyderabad', 'Posted in the last 2 days'])
  })

  it('caps the score at 99', () => {
    const r = scoreJob(
      { ...posting('Python, JavaScript, PostgreSQL'), postedAt: new Date('2026-11-16T00:00:00Z') },
      c,
      { skills: ['python', 'javascript', 'postgresql'], preferred: ['SDE'] },
      now,
    )
    expect(r.score).toBe(99)
  })

  it('does not count prose words as skills', () => {
    const r = scoreJob(
      posting('Go beyond. Take the rest of the day. Spark joy. Swift replies.'),
      c,
      defaultProfile,
      now,
    )
    expect(r.required).toEqual([])
    expect(r.matched).toEqual([])
  })

  it('the default profile exists and canonicalises cleanly against typical postings', () => {
    expect(defaultProfile.skills.length).toBeGreaterThan(10)
    const r = scoreJob(posting('Node, NestJS, Postgres, Docker, AWS and Terraform.'), c, defaultProfile, now)
    expect(r.matched).toEqual(['node.js', 'nestjs', 'postgresql', 'docker'])
    expect(r.missing).toEqual(['aws', 'terraform'])
  })
})
