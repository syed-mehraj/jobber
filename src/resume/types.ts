/*
 * The content of one resume (Phase 3.1). It is stored as JSON in `resumes.content`.
 *
 * Every item and every bullet has a stable string id, so the editor, the preview and the undo stack
 * can all point at the same thing: `experience.exp-parallel-labs.bullets.b-pl-1`. Ids never change
 * when things are reordered, and they are unique across the whole resume.
 */

export type SectionKey =
  'contact' | 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'certifications' | 'custom'

export const SECTION_KEYS: readonly SectionKey[] = [
  'contact',
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
  'custom',
]

/** Each section can be hidden without losing its content. */
type Hideable = { hidden: boolean }

export type Bullet = { id: string; text: string }

export type Contact = Hideable & {
  name: string
  /** A short line under the name, such as the role being applied for. */
  title: string
  location: string
  email: string
  /** Plain addresses without a scheme, such as "github.com/name". Never a phone number or street address. */
  github: string
  linkedin: string
  website: string
}

export type Summary = Hideable & { text: string }

export type ExperienceItem = {
  id: string
  company: string
  role: string
  location: string
  start: string
  end: string
  bullets: Bullet[]
}

export type ProjectItem = {
  id: string
  name: string
  /** Technologies, written as one line: "Python, Gemini API". */
  stack: string
  /** Optional dates, such as "2026". */
  dates: string
  bullets: Bullet[]
}

export type EducationItem = {
  id: string
  school: string
  degree: string
  location: string
  start: string
  end: string
  /** Optional grade line, such as "CGPA 9.0 / 10". */
  score: string
  bullets: Bullet[]
}

export type SkillItem = { id: string; name: string }
export type SkillGroup = { id: string; label: string; items: SkillItem[] }

export type CertificationItem = { id: string; name: string; issuer: string; date: string }

export type ResumeContent = {
  /** Shape version, so later changes can migrate old rows. */
  version: 1
  /** The order sections appear in on the page. Contains every section key once. */
  order: SectionKey[]
  contact: Contact
  summary: Summary
  experience: Hideable & { items: ExperienceItem[] }
  projects: Hideable & { items: ProjectItem[] }
  education: Hideable & { items: EducationItem[] }
  skills: Hideable & { groups: SkillGroup[] }
  certifications: Hideable & { items: CertificationItem[] }
  /** One free section with a title you choose: awards, volunteering, interests. */
  custom: Hideable & { title: string; bullets: Bullet[] }
}

/** Narrows the loosely typed JSON column. Anything that is not a resume of this shape gives null. */
export function toContent(raw: unknown): ResumeContent | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Partial<ResumeContent>
  if (c.version !== 1 || !Array.isArray(c.order)) return null
  for (const key of SECTION_KEYS) if (!c[key] || typeof c[key] !== 'object') return null
  return c as ResumeContent
}

/** Every bullet in the resume, including hidden sections. */
function allBullets(c: ResumeContent): Bullet[] {
  return [
    ...c.experience.items.flatMap((i) => i.bullets),
    ...c.projects.items.flatMap((i) => i.bullets),
    ...c.education.items.flatMap((i) => i.bullets),
    ...c.custom.bullets,
  ]
}

/** How many bullets the resume shows: those in sections that are not hidden. */
export function countBullets(c: ResumeContent): number {
  const n = (hidden: boolean, bullets: Bullet[][]) => (hidden ? 0 : bullets.reduce((sum, b) => sum + b.length, 0))
  return (
    n(
      c.experience.hidden,
      c.experience.items.map((i) => i.bullets),
    ) +
    n(
      c.projects.hidden,
      c.projects.items.map((i) => i.bullets),
    ) +
    n(
      c.education.hidden,
      c.education.items.map((i) => i.bullets),
    ) +
    n(c.custom.hidden, [c.custom.bullets])
  )
}

/** How many sections have something to show: not hidden, and not empty. */
export function countSections(c: ResumeContent): number {
  const has: Record<SectionKey, boolean> = {
    contact: Boolean(c.contact.name),
    summary: Boolean(c.summary.text),
    experience: c.experience.items.length > 0,
    projects: c.projects.items.length > 0,
    education: c.education.items.length > 0,
    skills: c.skills.groups.some((g) => g.items.length > 0),
    certifications: c.certifications.items.length > 0,
    custom: c.custom.bullets.length > 0,
  }
  return SECTION_KEYS.filter((key) => !c[key].hidden && has[key]).length
}

/** Every skill named in the skills section, lowercase and without duplicates, ready for job matching. */
export function allSkills(c: ResumeContent): string[] {
  const seen = new Set<string>()
  for (const group of c.skills.groups) {
    for (const item of group.items) {
      const name = item.name.trim().toLowerCase()
      if (name && !name.startsWith('todo')) seen.add(name)
    }
  }
  return [...seen]
}

/** Every id in the resume (items, bullets, skill groups and skills). Used to check they are unique. */
export function allIds(c: ResumeContent): string[] {
  return [
    ...c.experience.items.map((i) => i.id),
    ...c.projects.items.map((i) => i.id),
    ...c.education.items.map((i) => i.id),
    ...c.skills.groups.flatMap((g) => [g.id, ...g.items.map((i) => i.id)]),
    ...c.certifications.items.map((i) => i.id),
    ...allBullets(c).map((b) => b.id),
  ]
}
