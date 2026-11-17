import { describe, expect, it } from 'vitest'
import { buildAssistantPrompt, validateSuggestions } from './ai'
import { masterResume } from './master'
import { fieldsOf } from './paths'

const m = masterResume
const exp = m.experience.items[0]
const other = m.experience.items[1]
const b1 = `experience.${exp.id}.bullets.${exp.bullets[0].id}`
const b2 = `experience.${exp.id}.bullets.${exp.bullets[1].id}`
const otherBullet = `experience.${other.id}.bullets.${other.bullets[0].id}`

describe('buildAssistantPrompt', () => {
  it('lists editable fields as path: value lines, plus the request, About-you and job description', () => {
    const out = buildAssistantPrompt({
      content: m,
      prompt: 'make my bullets more impact-focused',
      about: ['I like backend work.'],
      jobDescription: 'Backend SDE, Go and Postgres',
    })
    expect(out.prompt).toContain(`${b1}: ${exp.bullets[0].text}`)
    expect(out.prompt).toContain('summary.text: ')
    expect(out.prompt).toContain('make my bullets more impact-focused')
    expect(out.prompt).toContain('I like backend work.')
    expect(out.prompt).toContain('Backend SDE, Go and Postgres')
    expect(out.prompt).not.toContain('READ-ONLY CONTEXT')
  })
  it('limits editable paths to the focus block and shows the rest as read-only context', () => {
    const out = buildAssistantPrompt({ content: m, prompt: 'fix grammar', focusBlock: `experience.${exp.id}` })
    const [editable, context] = out.prompt.split('READ-ONLY CONTEXT')
    expect(editable).toContain(b1)
    expect(editable).not.toContain(otherBullet)
    expect(context).toContain(otherBullet)
    expect(context).toContain('summary.text')
  })
  it('states the safety rules in the system instruction and asks for the right schema', () => {
    const out = buildAssistantPrompt({ content: m, prompt: 'x' })
    expect(out.system).toContain('final-year computer science student')
    expect(out.system).toContain('[add number]')
    expect(out.system).toContain('contact.email')
    expect(JSON.stringify(out.schema)).toContain('"maxItems":12')
    expect(JSON.stringify(out.schema)).toContain('suggestions')
  })
})

describe('validateSuggestions', () => {
  const s = (path: string, after: string, reason = 'why') => ({ path, after, reason })

  it('fills before from the resume and keeps valid suggestions', () => {
    const r = validateSuggestions(m, { message: ' Done ', suggestions: [s(b1, 'Built a thing')] })
    expect(r.message).toBe('Done')
    expect(r.suggestions).toEqual([{ path: b1, before: exp.bullets[0].text, after: 'Built a thing', reason: 'why' }])
  })
  it('drops unknown paths, contact links, empty, identical and too long text', () => {
    const r = validateSuggestions(m, {
      message: '',
      suggestions: [
        s('experience.nope.role', 'x'),
        s('experience.heading', 'x'),
        s('contact.email', 'a@b.co'),
        s('contact.github', 'github.com/x'),
        s('contact.linkedin', 'x'),
        s('contact.website', 'x'),
        s(b1, '   '),
        s(b2, exp.bullets[1].text),
        s('summary.text', 'x'.repeat(601)),
        s('contact.title', 'Software Engineer'),
        { path: 5, after: 'x' },
        null,
      ],
    })
    expect(r.suggestions.map((x) => x.path)).toEqual(['contact.title'])
  })
  it('respects allowedPaths', () => {
    const allowed = fieldsOf(m, `experience.${exp.id}`).map((f) => f.path)
    const r = validateSuggestions(
      m,
      { suggestions: [s(b1, 'A'), s(otherBullet, 'B'), s('summary.text', 'C')] },
      allowed,
    )
    expect(r.suggestions.map((x) => x.path)).toEqual([b1])
  })
  it('keeps the first suggestion per path and caps at 12', () => {
    const dup = validateSuggestions(m, { suggestions: [s(b1, 'first'), s(b1, 'second')] })
    expect(dup.suggestions).toHaveLength(1)
    expect(dup.suggestions[0].after).toBe('first')
    const paths = [
      ...m.projects.items.flatMap((p) => p.bullets.map((b) => `projects.${p.id}.bullets.${b.id}`)),
      b1,
      b2,
      otherBullet,
    ]
    expect(paths.length).toBeGreaterThan(12)
    const many = validateSuggestions(m, { suggestions: paths.map((p, i) => s(p, `New ${i}`)) })
    expect(many.suggestions).toHaveLength(12)
  })
  it('strips markdown', () => {
    const r = validateSuggestions(m, { suggestions: [s(b1, '- **Built** a `cache`\n- and more', '**Stronger** verb')] })
    expect(r.suggestions[0].after).toBe('Built a cache\nand more')
    expect(r.suggestions[0].reason).toBe('Stronger verb')
  })
  it('survives garbage', () => {
    expect(validateSuggestions(m, null)).toEqual({ message: '', suggestions: [] })
    expect(validateSuggestions(m, { suggestions: 'no' })).toEqual({ message: '', suggestions: [] })
  })
})
