import { newId } from './paths'
import type { ResumeContent, SectionKey } from './types'

/*
 * Whole-item edits for the editor: add an entry to a section, remove one, hide or show a section.
 * Pure functions; each returns a new resume.
 */

export type AddableSection = 'experience' | 'projects' | 'education' | 'skills' | 'certifications' | 'custom'

export const ADDABLE: { section: AddableSection; label: string }[] = [
  { section: 'experience', label: 'Experience' },
  { section: 'projects', label: 'Project' },
  { section: 'education', label: 'Education' },
  { section: 'skills', label: 'Skill group' },
  { section: 'certifications', label: 'Certification' },
  { section: 'custom', label: 'Bullet in an extra section' },
]

/** Adds an empty entry and returns the new resume and the block to select ("experience.<id>"…). */
export function addItem(content: ResumeContent, section: AddableSection): { content: ResumeContent; block: string } {
  const c = structuredClone(content)
  const bullet = () => ({ id: newId('b'), text: '' })
  switch (section) {
    case 'experience': {
      const id = newId('exp')
      c.experience.items.unshift({
        id,
        company: 'Company',
        role: 'Role',
        location: '',
        start: '',
        end: '',
        bullets: [bullet()],
      })
      c.experience.hidden = false
      return { content: c, block: `experience.${id}` }
    }
    case 'projects': {
      const id = newId('prj')
      c.projects.items.unshift({ id, name: 'Project name', stack: '', dates: '', bullets: [bullet()] })
      c.projects.hidden = false
      return { content: c, block: `projects.${id}` }
    }
    case 'education': {
      const id = newId('edu')
      c.education.items.push({
        id,
        school: 'School',
        degree: 'Degree',
        location: '',
        start: '',
        end: '',
        score: '',
        bullets: [],
      })
      c.education.hidden = false
      return { content: c, block: `education.${id}` }
    }
    case 'skills': {
      const id = newId('sk')
      c.skills.groups.push({ id, label: 'Skills', items: [{ id: newId('s'), name: 'Skill' }] })
      c.skills.hidden = false
      return { content: c, block: `skills.${id}` }
    }
    case 'certifications': {
      const id = newId('cert')
      c.certifications.items.push({ id, name: 'Certification', issuer: '', date: '' })
      c.certifications.hidden = false
      return { content: c, block: `certifications.${id}` }
    }
    case 'custom': {
      c.custom.bullets.push(bullet())
      c.custom.hidden = false
      if (!c.custom.title) c.custom.title = 'Additional'
      return { content: c, block: 'custom' }
    }
  }
}

/** Removes an item ("experience.<id>", "skills.<groupId>"…). Contact, summary and custom can't be removed, only hidden. */
export function removeItem(content: ResumeContent, block: string): ResumeContent {
  const [section, id] = block.split('.')
  if (!id) return content
  const c = structuredClone(content)
  if (section === 'skills') c.skills.groups = c.skills.groups.filter((g) => g.id !== id)
  else if (['experience', 'projects', 'education', 'certifications'].includes(section)) {
    const s = c[section as 'experience']
    s.items = s.items.filter((i) => i.id !== id)
  } else return content
  return c
}

/** Adds a skill to a skill group and returns its path. */
export function addSkill(content: ResumeContent, groupId: string): { content: ResumeContent; path: string } | null {
  const c = structuredClone(content)
  const g = c.skills.groups.find((x) => x.id === groupId)
  if (!g) return null
  const skill = { id: newId('s'), name: '' }
  g.items.push(skill)
  return { content: c, path: `skills.${groupId}.items.${skill.id}` }
}

/** Removes a skill by path ("skills.<groupId>.items.<skillId>"). */
export function removeSkill(content: ResumeContent, path: string): ResumeContent {
  const [, groupId, , skillId] = path.split('.')
  const c = structuredClone(content)
  const g = c.skills.groups.find((x) => x.id === groupId)
  if (!g) return content
  g.items = g.items.filter((s) => s.id !== skillId)
  return c
}

/** Hides or shows a whole section. */
export function setHidden(content: ResumeContent, section: SectionKey, hidden: boolean): ResumeContent {
  if (content[section].hidden === hidden) return content
  const c = structuredClone(content)
  c[section].hidden = hidden
  return c
}

/** Moves a section up (-1) or down (+1) in the page order. */
export function moveSection(content: ResumeContent, section: SectionKey, dir: -1 | 1): ResumeContent {
  const i = content.order.indexOf(section)
  const j = i + dir
  if (i < 0 || j < 0 || j >= content.order.length) return content
  const c = structuredClone(content)
  ;[c.order[i], c.order[j]] = [c.order[j], c.order[i]]
  return c
}

/** A starting point for a blank resume: the contact details from `from`, everything else empty. */
export function blankResume(from: ResumeContent): ResumeContent {
  return {
    version: 1,
    order: [...from.order],
    contact: { ...from.contact, title: '' },
    summary: { hidden: false, text: '' },
    experience: { hidden: false, items: [] },
    projects: { hidden: false, items: [] },
    education: { hidden: false, items: structuredClone(from.education.items) },
    skills: { hidden: false, groups: [] },
    certifications: { hidden: true, items: [] },
    custom: { hidden: true, title: 'Additional', bullets: [] },
  }
}
