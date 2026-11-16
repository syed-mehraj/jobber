import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { masterResume } from './master'
import { ResumePage } from './render'
import { allIds, allSkills, countBullets, countSections, toContent, type ResumeContent } from './types'

const clone = (c: ResumeContent): ResumeContent => structuredClone(c)

describe('master resume', () => {
  it('has a unique id on every item and bullet', () => {
    const ids = allIds(masterResume)
    expect(ids.length).toBeGreaterThan(30)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('lists every section once', () => {
    expect([...masterResume.order].sort()).toEqual(
      ['certifications', 'contact', 'custom', 'education', 'experience', 'projects', 'skills', 'summary'].sort(),
    )
  })

  it('contains no phone-number-like strings', () => {
    const text = JSON.stringify(masterResume)
    expect(text).not.toMatch(/\+\d[\d\s().-]{7,}\d/)
    expect(text).not.toMatch(/\b\d{3}[\s.-]\d{3,4}[\s.-]\d{4}\b/)
    expect(text).not.toMatch(/\d{10,}/)
  })

  it('survives a round trip through JSON', () => {
    expect(toContent(JSON.parse(JSON.stringify(masterResume)))).toEqual(masterResume)
    expect(toContent({})).toBeNull()
    expect(toContent(null)).toBeNull()
  })

  it('counts sections and bullets', () => {
    expect(countSections(masterResume)).toBe(7) // the custom section is hidden and empty
    const bullets = countBullets(masterResume)
    expect(bullets).toBeGreaterThan(10)
    const hidden = clone(masterResume)
    hidden.experience.hidden = true
    expect(countBullets(hidden)).toBe(bullets - masterResume.experience.items.reduce((n, i) => n + i.bullets.length, 0))
    expect(countSections(hidden)).toBe(6)
  })
})

describe('allSkills', () => {
  it('returns lowercase, deduplicated skills', () => {
    const c = clone(masterResume)
    c.skills.groups[0].items.push({ id: 's-extra-1', name: '  PYTHON ' }, { id: 's-extra-2', name: 'TODO' })
    const skills = allSkills(c)
    expect(skills).toContain('python')
    expect(skills).toContain('nestjs')
    expect(skills).toContain('retrieval-augmented generation')
    expect(skills.filter((s) => s === 'python')).toHaveLength(1)
    expect(skills.every((s) => s === s.toLowerCase().trim())).toBe(true)
    expect(skills).not.toContain('todo')
  })
})

describe('Simple template', () => {
  it('puts a data-path on the text it renders', () => {
    const { container } = render(<ResumePage content={masterResume} />)
    const paths = [...container.querySelectorAll('[data-path]')].map((e) => e.getAttribute('data-path'))
    expect(paths).toContain('contact.name')
    expect(paths).toContain('summary.text')
    expect(paths).toContain('experience.exp-parallel-labs.company')
    expect(paths).toContain('experience.exp-parallel-labs.bullets.b-pl-1')
    expect(paths).toContain('skills.sk-lang.items.s-lang-python')
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('gives every element that holds text a data-path (or marks it as a separator)', () => {
    const { container } = render(<ResumePage content={masterResume} />)
    for (const el of container.querySelectorAll('*')) {
      const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
      if (ownText)
        expect(el.hasAttribute('data-path') || el.hasAttribute('data-sep'), el.outerHTML.slice(0, 80)).toBe(true)
    }
  })

  it('uses standard section names, in the order given, and skips hidden sections', () => {
    const c = clone(masterResume)
    c.order = ['contact', 'skills', 'experience', 'summary', 'projects', 'education', 'certifications', 'custom']
    c.projects.hidden = true
    const { container } = render(<ResumePage content={c} />)
    const headings = [...container.querySelectorAll('h2')].map((h) => h.textContent)
    expect(headings).toEqual(['Skills', 'Experience', 'Summary', 'Education', 'Certifications'])
  })

  it('uses real text and links, and no tables', () => {
    const { container } = render(<ResumePage content={masterResume} />)
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('a[href="mailto:smrmehraj123@gmail.com"]')).not.toBeNull()
    expect(container.querySelector('a[href="https://github.com/smrmehraj"]')).not.toBeNull()
    // an unfilled link stays plain text
    expect(container.querySelector('[data-path="contact.linkedin"]')?.tagName).toBe('SPAN')
  })
})

describe('seeding', () => {
  it('adds the master resume once and sets the profile skills from it', async () => {
    const { createTestDb } = await import('@/db/testing')
    const { syncCatalog } = await import('@/db/seed')
    const { resumes, settings } = await import('@/db/schema')
    const { defaultProfile } = await import('@/jobs/score')
    const db = await createTestDb({ seed: true })

    const rows = await db.select().from(resumes)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: 'Master resume', isMaster: true })
    expect(toContent(rows[0].content)).toEqual(masterResume)

    const { eq } = await import('drizzle-orm')
    const [profile] = await db.select().from(settings).where(eq(settings.key, 'profile'))
    expect(profile.value).toEqual({ skills: allSkills(masterResume), preferred: defaultProfile.preferred })

    const { abouts } = await import('@/db/schema')
    const aboutRows = await db.select().from(abouts)
    expect(aboutRows).toHaveLength(1)
    expect(aboutRows[0].text).toContain('AI Engineer at Parcera')

    await syncCatalog(db) // a second run changes nothing
    expect(await db.select().from(resumes)).toHaveLength(1)
    expect(await db.select().from(abouts)).toHaveLength(1)
  }, 30_000)
})
