import { describe, expect, it } from 'vitest'
import { masterResume } from './master'
import {
  addBullet,
  addBulletAfter,
  allTextFields,
  blockLabel,
  blockOf,
  fieldsOf,
  getAt,
  moveBullet,
  removeBullet,
  setAt,
} from './paths'

const m = masterResume
const exp = m.experience.items[0]
const b1 = `experience.${exp.id}.bullets.${exp.bullets[0].id}`
const b2 = `experience.${exp.id}.bullets.${exp.bullets[1].id}`

describe('paths', () => {
  it('reads every kind of text field', () => {
    expect(getAt(m, 'contact.name')).toBe(m.contact.name)
    expect(getAt(m, 'summary.text')).toBe(m.summary.text)
    expect(getAt(m, `experience.${exp.id}.role`)).toBe(exp.role)
    expect(getAt(m, b1)).toBe(exp.bullets[0].text)
    const g = m.skills.groups[0]
    expect(getAt(m, `skills.${g.id}.label`)).toBe(g.label)
    expect(getAt(m, `skills.${g.id}.items.${g.items[0].id}`)).toBe(g.items[0].name)
    expect(getAt(m, 'custom.title')).toBe(m.custom.title)
  })
  it('refuses headings, ids, whole items and unknown paths', () => {
    expect(getAt(m, 'experience.heading')).toBeUndefined()
    expect(getAt(m, `experience.${exp.id}.id`)).toBeUndefined()
    expect(getAt(m, `experience.${exp.id}`)).toBeUndefined()
    expect(getAt(m, 'experience.nope.role')).toBeUndefined()
  })
  it('sets text without mutating the original', () => {
    const next = setAt(m, b1, 'New bullet')
    expect(getAt(next, b1)).toBe('New bullet')
    expect(getAt(m, b1)).toBe(exp.bullets[0].text)
    expect(setAt(m, 'experience.nope.role', 'x')).toBe(m)
  })
  it('finds blocks and their fields', () => {
    expect(blockOf(b1)).toBe(`experience.${exp.id}`)
    expect(blockOf('contact.email')).toBe('contact')
    const fields = fieldsOf(m, `experience.${exp.id}`)
    expect(fields.map((f) => f.label)).toEqual(expect.arrayContaining(['Company', 'Role', 'Bullet 1']))
    expect(fields.find((f) => f.path === b1)?.multiline).toBe(true)
    expect(blockLabel(m, `experience.${exp.id}`)).toContain(exp.company)
    expect(allTextFields(m).length).toBeGreaterThan(30)
  })
  it('adds, moves and removes bullets', () => {
    const added = addBulletAfter(m, b1)!
    expect(getAt(added.content, added.path)).toBe('')
    expect(added.content.experience.items[0].bullets[1].id).toBe(added.path.split('.').pop())
    const moved = moveBullet(m, b2, -1)
    expect(moved.experience.items[0].bullets[0].id).toBe(exp.bullets[1].id)
    expect(removeBullet(m, b1).experience.items[0].bullets).toHaveLength(exp.bullets.length - 1)
    const end = addBullet(m, `experience.${exp.id}`)!
    expect(end.content.experience.items[0].bullets.at(-1)?.text).toBe('')
  })
})

describe('selection scopes', () => {
  it('fieldsOf a single line returns just that line; of a section, every entry', () => {
    expect(fieldsOf(m, b1)).toHaveLength(1)
    expect(fieldsOf(m, b1)[0].label).toBe('Bullet 1')
    const section = fieldsOf(m, 'experience')
    expect(section.length).toBe(m.experience.items.flatMap((i) => fieldsOf(m, `experience.${i.id}`)).length)
    expect(fieldsOf(m, 'skills').length).toBeGreaterThan(5)
  })
  it('labels lines with their entry', () => {
    expect(blockLabel(m, b1)).toBe(`Experience · ${exp.company} · Bullet 1`)
    expect(blockLabel(m, 'contact.name')).toBe('Contact · Name')
    expect(blockLabel(m, 'experience')).toBe('Experience')
  })
})
