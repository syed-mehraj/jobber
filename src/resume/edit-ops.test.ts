import { describe, expect, it } from 'vitest'
import { addItem, addSkill, blankResume, moveSection, removeItem, removeSkill, setHidden } from './edit-ops'
import { masterResume as m } from './master'
import { getAt } from './paths'

describe('edit-ops', () => {
  it('adds an entry to each section and returns its block', () => {
    for (const s of ['experience', 'projects', 'education', 'skills', 'certifications', 'custom'] as const) {
      const { content, block } = addItem(m, s)
      expect(block.startsWith(s)).toBe(true)
      expect(content[s].hidden).toBe(false)
      expect(content).not.toBe(m)
    }
    const { content, block } = addItem(m, 'experience')
    expect(getAt(content, `${block}.company`)).toBe('Company')
  })
  it('removes entries but not whole fixed sections', () => {
    const id = m.projects.items[0].id
    expect(removeItem(m, `projects.${id}`).projects.items).toHaveLength(m.projects.items.length - 1)
    expect(removeItem(m, 'summary')).toBe(m)
  })
  it('adds and removes skills', () => {
    const g = m.skills.groups[0]
    const r = addSkill(m, g.id)!
    expect(getAt(r.content, r.path)).toBe('')
    expect(removeSkill(r.content, r.path).skills.groups[0].items).toHaveLength(g.items.length)
  })
  it('hides sections and reorders them', () => {
    expect(setHidden(m, 'projects', true).projects.hidden).toBe(true)
    const i = m.order.indexOf('projects')
    expect(moveSection(m, 'projects', -1).order[i - 1]).toBe('projects')
  })
  it('makes a blank resume that keeps only contact and education', () => {
    const b = blankResume(m)
    expect(b.contact.name).toBe(m.contact.name)
    expect(b.experience.items).toHaveLength(0)
    expect(b.education.items).toHaveLength(m.education.items.length)
  })
})
