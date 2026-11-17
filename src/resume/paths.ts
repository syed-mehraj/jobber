import type { Bullet, ResumeContent, SectionKey } from './types'

/*
 * Addressing text inside a resume by path, the same strings the template puts in `data-path`:
 *   contact.name · summary.text · experience.<itemId>.role · experience.<itemId>.bullets.<bulletId>
 *   skills.<groupId>.label · skills.<groupId>.items.<skillId> · certifications.<itemId>.issuer
 *   custom.title · custom.bullets.<bulletId>
 * Section headings (`<section>.heading`) are labels, not content, and are never editable (except custom.title).
 *
 * Everything here is pure: setAt and the edit helpers return a new resume and never mutate the old one,
 * so the editor can keep an undo history by reference.
 */

export type FieldInfo = { path: string; label: string; multiline: boolean; value: string }

const ARRAY_KEYS = ['items', 'groups', 'bullets'] as const

type Node = Record<string, unknown>

function childArray(node: Node): Node[] | null {
  for (const k of ARRAY_KEYS) if (Array.isArray(node[k])) return node[k] as Node[]
  return null
}

/** Walks a path to its parent node and final key. Returns null when any step is missing. */
function resolve(content: ResumeContent, path: string): { parent: Node; key: string | number } | null {
  const parts = path.split('.')
  if (parts.length < 2 || parts.at(-1) === 'heading') return null
  let node: unknown = (content as unknown as Node)[parts[0]]
  for (let i = 1; i < parts.length; i++) {
    if (!node || typeof node !== 'object') return null
    const seg = parts[i]
    const last = i === parts.length - 1
    const obj = node as Node
    if (Array.isArray(obj)) {
      const idx = (obj as Node[]).findIndex((x) => x.id === seg)
      if (idx < 0) return null
      if (last) return { parent: obj as unknown as Node, key: idx }
      node = obj[idx]
      continue
    }
    if (seg in obj && seg !== 'id') {
      if (last) return typeof obj[seg] === 'string' ? { parent: obj, key: seg } : null
      node = obj[seg]
      continue
    }
    // An id directly under a section ("experience.<id>") refers to an element of its items/groups list.
    const arr = childArray(obj)
    if (!arr) return null
    const idx = arr.findIndex((x) => x.id === seg)
    if (idx < 0) return null
    if (last) return null // a whole item is not a text field
    node = arr[idx]
  }
  return null
}

/** The text stored at a path, or undefined if there is no editable text there. */
export function getAt(content: ResumeContent, path: string): string | undefined {
  const r = resolve(content, path)
  if (!r) return undefined
  const v = (r.parent as Node)[r.key as string]
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    const o = v as Node
    if (typeof o.text === 'string') return o.text
    if (typeof o.name === 'string') return o.name
  }
  return undefined
}

/** A new resume with the text at `path` replaced. Unknown paths return the resume unchanged. */
export function setAt(content: ResumeContent, path: string, value: string): ResumeContent {
  if (getAt(content, path) === undefined || getAt(content, path) === value) return content
  const next = structuredClone(content)
  const r = resolve(next, path)!
  const parent = r.parent as Node
  const current = parent[r.key as string]
  if (typeof current === 'string') parent[r.key as string] = value
  else {
    const o = current as Node
    if (typeof o.text === 'string') o.text = value
    else o.name = value
  }
  return next
}

/** The block a path belongs to: "contact", "summary", "experience.<id>", "skills.<groupId>", "custom". */
export function blockOf(path: string): string {
  const [section, second] = path.split('.')
  if (['contact', 'summary', 'custom'].includes(section)) return section
  return second ? `${section}.${second}` : section
}

const LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Headline',
  location: 'Location',
  email: 'Email',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  website: 'Website',
  text: 'Summary',
  company: 'Company',
  role: 'Role',
  start: 'Start',
  end: 'End',
  stack: 'Tech stack',
  dates: 'Dates',
  school: 'School',
  degree: 'Degree',
  score: 'Grade',
  issuer: 'Issuer',
  date: 'Date',
  label: 'Group name',
}

/** Every editable field in a block, in reading order, for the close-up editor. */
export function fieldsOf(content: ResumeContent, block: string): FieldInfo[] {
  // A single line: just that field.
  const single = getAt(content, block)
  if (single !== undefined) {
    const all = fieldsOf(content, blockOf(block))
    const f = all.find((x) => x.path === block)
    return f ? [f] : [{ path: block, label: 'Text', multiline: single.length > 60, value: single }]
  }
  const [section, id] = block.split('.') as [SectionKey, string | undefined]
  // A whole list section ("experience", "skills"…): every entry's fields.
  if (!id && ['experience', 'projects', 'education', 'certifications', 'skills'].includes(section)) {
    const ids =
      section === 'skills'
        ? content.skills.groups.map((g) => g.id)
        : (content[section] as { items: { id: string }[] }).items.map((i) => i.id)
    return ids.flatMap((i) => fieldsOf(content, `${section}.${i}`))
  }
  const out: FieldInfo[] = []
  const push = (path: string, label: string, multiline = false) => {
    const value = getAt(content, path)
    if (value !== undefined) out.push({ path, label, multiline, value })
  }
  const bullets = (base: string, list: Bullet[]) =>
    list.forEach((b, i) => push(`${base}.bullets.${b.id}`, `Bullet ${i + 1}`, true))

  if (section === 'contact') {
    for (const k of ['name', 'title', 'location', 'email', 'github', 'linkedin', 'website'])
      push(`contact.${k}`, LABELS[k])
  } else if (section === 'summary') push('summary.text', 'Summary', true)
  else if (section === 'custom') {
    push('custom.title', 'Section title')
    bullets('custom', content.custom.bullets)
  } else if (section === 'skills' && id) {
    const g = content.skills.groups.find((x) => x.id === id)
    if (g) {
      push(`skills.${id}.label`, LABELS.label)
      g.items.forEach((s, i) => push(`skills.${id}.items.${s.id}`, `Skill ${i + 1}`))
    }
  } else if (id) {
    const list = (content[section] as { items: Node[] }).items
    const item = list.find((x) => x.id === id)
    if (item) {
      for (const k of Object.keys(item))
        if (k !== 'id' && typeof item[k] === 'string') push(`${block}.${k}`, LABELS[k] ?? k)
      if (Array.isArray(item.bullets)) bullets(block, item.bullets as Bullet[])
    }
  }
  return out
}

/** A human name for a block: "Experience · Parcera", "Skills · Languages", "Summary". */
export function blockLabel(content: ResumeContent, block: string): string {
  if (getAt(content, block) !== undefined) {
    const field = fieldsOf(content, block)[0]
    const parent = blockOf(block)
    return parent === block ? (field?.label ?? 'Line') : `${blockLabel(content, parent)} · ${field?.label ?? 'Line'}`
  }
  const [section, id] = block.split('.')
  const title = section.charAt(0).toUpperCase() + section.slice(1)
  if (!id) return section === 'custom' ? content.custom.title || 'Additional' : title
  if (section === 'skills') return `Skills · ${content.skills.groups.find((g) => g.id === id)?.label ?? ''}`
  const item = (content[section as SectionKey] as { items?: Node[] }).items?.find((x) => x.id === id)
  const name = item ? String(item.company ?? item.name ?? item.school ?? '') : ''
  return name ? `${title} · ${name}` : title
}

/** Every editable text path in the resume (hidden sections included), with its value. For the AI assistant. */
export function allTextFields(content: ResumeContent): FieldInfo[] {
  const blocks: string[] = ['contact', 'summary']
  for (const s of ['experience', 'projects', 'education', 'certifications'] as const)
    content[s].items.forEach((i) => blocks.push(`${s}.${i.id}`))
  content.skills.groups.forEach((g) => blocks.push(`skills.${g.id}`))
  blocks.push('custom')
  return blocks.flatMap((b) => fieldsOf(content, b))
}

export const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

/** The bullet list a bullet path lives in, as [parent, index]. */
function bulletList(content: ResumeContent, path: string): [Bullet[], number] | null {
  if (!/\.bullets\.[^.]+$/.test(path)) return null
  const r = resolve(content, path)
  if (!r || typeof r.key !== 'number') return null
  return [r.parent as unknown as Bullet[], r.key]
}

/** Adds an empty bullet after the given bullet. Returns the new resume and the new bullet's path. */
export function addBulletAfter(content: ResumeContent, path: string): { content: ResumeContent; path: string } | null {
  const next = structuredClone(content)
  const found = bulletList(next, path)
  if (!found) return null
  const [list, i] = found
  const bullet = { id: newId('b'), text: '' }
  list.splice(i + 1, 0, bullet)
  return { content: next, path: path.replace(/[^.]+$/, bullet.id) }
}

/** Removes a bullet. */
export function removeBullet(content: ResumeContent, path: string): ResumeContent {
  const next = structuredClone(content)
  const found = bulletList(next, path)
  if (!found) return content
  found[0].splice(found[1], 1)
  return next
}

/** Moves a bullet up (-1) or down (+1) within its list. */
export function moveBullet(content: ResumeContent, path: string, dir: -1 | 1): ResumeContent {
  const next = structuredClone(content)
  const found = bulletList(next, path)
  if (!found) return content
  const [list, i] = found
  const j = i + dir
  if (j < 0 || j >= list.length) return content
  ;[list[i], list[j]] = [list[j], list[i]]
  return next
}

/** Adds a bullet at the end of a block that has bullets (experience/projects/education item, or custom). */
export function addBullet(content: ResumeContent, block: string): { content: ResumeContent; path: string } | null {
  const next = structuredClone(content)
  const [section, id] = block.split('.')
  let list: Bullet[] | undefined
  if (section === 'custom') list = next.custom.bullets
  else if (id && ['experience', 'projects', 'education'].includes(section))
    list = (next[section as 'experience'].items.find((x) => x.id === id) as { bullets: Bullet[] } | undefined)?.bullets
  if (!list) return null
  const bullet = { id: newId('b'), text: '' }
  list.push(bullet)
  return { content: next, path: `${block}.bullets.${bullet.id}` }
}
