import { describe, expect, it } from 'vitest'
import { classify, minYears, regionOf } from './filters'
import type { RawPosting } from './types'

const now = new Date('2026-11-16T06:00:00Z')
const p = (title: string, location = 'Bengaluru, India', extra: Partial<RawPosting> = {}): RawPosting => ({
  externalId: '1',
  company: 'Acme',
  title,
  location,
  url: 'https://example.com',
  postedAt: new Date('2026-11-14T00:00:00Z'),
  ...extra,
})

describe('classify', () => {
  it('keeps internships, new-grad and entry roles in India', () => {
    expect(classify(p('Software Engineering Intern', 'Hyderabad'), now)).toMatchObject({
      keep: true,
      level: 'intern',
      region: 'hyderabad',
    })
    expect(classify(p('Graduate Software Engineer'), now)).toMatchObject({
      keep: true,
      level: 'new-grad',
      region: 'india',
    })
    expect(classify(p('SDE I'), now)).toMatchObject({ keep: true, level: 'new-grad' })
    expect(
      classify(p('Backend Engineer', 'Pune', { description: '0-1 years of experience in Go' }), now),
    ).toMatchObject({ keep: true, level: 'entry' })
  })

  it('drops roles a 2027 graduate cannot get', () => {
    expect(classify(p('Senior Software Engineer'), now)).toMatchObject({ keep: false, reason: 'senior role' })
    expect(classify(p('Software Engineer II'), now)).toMatchObject({ keep: false, reason: 'senior role' })
    expect(classify(p('Staff ML Engineer'), now)).toMatchObject({ keep: false })
    expect(
      classify(p('Backend Engineer', 'Pune', { description: 'You have 3+ years of experience' }), now),
    ).toMatchObject({ keep: false, reason: 'asks for 3+ years' })
    expect(classify(p('Software Engineer, New Grad 2026'), now)).toMatchObject({ keep: false, reason: 'past intake' })
    expect(classify(p('Account Executive'), now)).toMatchObject({ keep: false, reason: 'not an engineering role' })
    expect(classify(p('Product Designer'), now)).toMatchObject({ keep: false })
    expect(classify(p('Software Intern', 'Bengaluru', { postedAt: new Date('2026-09-01') }), now)).toMatchObject({
      keep: false,
      reason: 'older than 45 days',
    })
  })

  it('keeps roles abroad only with visa sponsorship, and never internships abroad', () => {
    expect(classify(p('New Grad Software Engineer', 'Seattle, WA'), now)).toMatchObject({ keep: false })
    expect(
      classify(
        p('New Grad Software Engineer', 'Berlin, Germany', {
          description: 'Visa sponsorship is available and relocation support.',
        }),
        now,
      ),
    ).toMatchObject({ keep: true, region: 'international', flags: ['Visa sponsorship offered'] })
    expect(
      classify(p('Software Engineer Intern', 'New York, NY', { hints: { sponsorship: 'Offers Sponsorship' } }), now),
    ).toMatchObject({ keep: false, reason: 'internship abroad' })
  })

  it('treats remote roles by where they are open to', () => {
    expect(classify(p('Junior Developer', 'Remote'), now)).toMatchObject({ keep: true, region: 'remote' })
    expect(classify(p('Junior Developer', 'Remote - US'), now)).toMatchObject({ keep: false })
    expect(
      classify(p('Junior Developer', 'Remote', { description: 'Must be authorized to work in the US' }), now),
    ).toMatchObject({ keep: false })
  })

  it('flags roles whose level is not stated', () => {
    expect(classify(p('Software Engineer'), now)).toMatchObject({
      keep: true,
      level: 'unspecified',
      flags: ['Experience not stated'],
    })
  })
})

describe('helpers', () => {
  it('reads the smallest years of experience asked for', () => {
    expect(minYears('Requires 2-4 years of experience. Bonus: 5+ years experience with Go')).toBe(2)
    expect(minYears('0 to 1 years of relevant experience')).toBe(0)
    expect(minYears('We are 10 years old')).toBeUndefined()
  })
  it('places locations', () => {
    expect(regionOf('Secunderabad, Telangana')).toBe('hyderabad')
    expect(regionOf('Gurgaon')).toBe('india')
    expect(regionOf('Remote (Anywhere)')).toBe('remote')
    expect(regionOf('Remote, Canada')).toBe('remote-elsewhere')
    expect(regionOf('London, UK')).toBe('international')
  })
})

describe('worthDetail', () => {
  it('fetches descriptions only for roles that could pass', async () => {
    const { worthDetail } = await import('./filters')
    expect(worthDetail({ title: 'Software Engineer', location: 'Bengaluru' })).toBe(true)
    expect(worthDetail({ title: 'New Grad Engineer', location: 'Dublin, Ireland' })).toBe(true)
    expect(worthDetail({ title: 'Software Engineering Intern', location: 'Dublin, Ireland' })).toBe(false)
    expect(worthDetail({ title: 'Senior Software Engineer', location: 'Bengaluru' })).toBe(false)
    expect(worthDetail({ title: 'Account Executive', location: 'Hyderabad' })).toBe(false)
  })
})

describe('tightened rules (from the first live run)', () => {
  it('drops experienced hires abroad even with sponsorship text', () => {
    expect(
      classify(
        p('Full Stack Software Engineer', 'San Francisco', { description: 'We offer relocation support.' }),
        now,
      ),
    ).toMatchObject({ keep: false, reason: 'abroad, level not stated' })
  })
  it('does not treat a remote flag on foreign cities as open to India', () => {
    expect(
      classify(
        p('Software Engineering Intern, Frontend', 'New York, New York; San Francisco, California', { remote: true }),
        now,
      ),
    ).toMatchObject({ keep: false })
    expect(regionOf('REMOTE (EEA)')).toBe('remote-elsewhere')
    expect(regionOf('Remote', true)).toBe('remote')
    expect(regionOf('100% Remote (Global)')).toBe('remote')
  })
  it('catches other senior and non-target wording', () => {
    expect(classify(p('Dir, Software Engrg Mgmt', 'Hyderabad'), now)).toMatchObject({ keep: false })
    expect(classify(p('Intermediate Backend Engineer'), now)).toMatchObject({ keep: false })
    expect(classify(p('Professional Services Engineer'), now)).toMatchObject({ keep: false })
  })
  it('requires an explicit level for strict sources and drops closed posts', () => {
    const hn = (title: string, description: string) => p(title, 'Remote', { description, hints: { strictLevel: true } })
    expect(classify(hn('Backend Engineer', 'We build databases. Python.'), now)).toMatchObject({
      keep: false,
      reason: 'level not stated',
    })
    expect(classify(hn('Backend Engineer', 'Hiring junior engineers, remote worldwide.'), now)).toMatchObject({
      keep: true,
      level: 'new-grad',
    })
    expect(classify(hn('ML Engineer', 'Interns welcome. UPDATE: no longer taking applications'), now)).toMatchObject({
      keep: false,
      reason: 'closed',
    })
  })
})

describe('more wording', () => {
  it('drops admin and people-systems roles, and reads "Engineer - I" as entry', () => {
    expect(classify(p('AI Tool Admin'), now)).toMatchObject({ keep: false })
    expect(classify(p('People Systems Engineer'), now)).toMatchObject({ keep: false })
    expect(classify(p('Devops Engineer - I', 'Gurugram'), now)).toMatchObject({ keep: true, level: 'new-grad' })
  })
})

describe('degree-gated roles', () => {
  it('drops PhD and MBA roles', () => {
    expect(classify(p('Software Engineering PhD Intern, Summer 2027', 'Bengaluru'), now)).toMatchObject({
      keep: false,
      reason: 'needs a PhD or MBA',
    })
    expect(classify(p('Student Researcher, 2027', 'Bengaluru'), now)).toMatchObject({ keep: true })
  })
})

describe('Amazon wording', () => {
  it('reads hyphenated levels and long experience phrases', () => {
    expect(classify(p('SDE-II, AB Mobile', 'Hyderabad'), now)).toMatchObject({ keep: false, reason: 'senior role' })
    expect(classify(p('Software Development Engineer - 3, Tax', 'Bengaluru'), now)).toMatchObject({ keep: false })
    expect(minYears('- 3+ years of non-internship professional software development experience')).toBe(3)
    expect(
      classify(
        p('Software Development Engineer, ESI', 'Hyderabad', {
          description: '- 3+ years of non-internship professional software development experience',
        }),
        now,
      ),
    ).toMatchObject({ keep: false, reason: 'asks for 3+ years' })
  })
})
