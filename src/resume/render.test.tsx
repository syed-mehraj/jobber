import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FONTS, TEMPLATES, defaultDesign, fontStack, toDesign, type ResumeDesign } from './design'
import { masterResume } from './master'
import { blockOf } from './paths'
import { ResumeBlock, ResumePage } from './render'
import type { ResumeContent } from './types'

const paths = (container: Element) =>
  [...container.querySelectorAll('[data-path]')].map((e) => e.getAttribute('data-path') as string)

/** The master resume with the custom section filled in, so every kind of block appears. */
const full: ResumeContent = {
  ...structuredClone(masterResume),
  custom: {
    hidden: false,
    title: 'Awards',
    bullets: [{ id: 'b-aw-1', text: 'Won a hackathon' }],
  },
}
full.contact.website = 'example.com'
full.contact.linkedin = 'linkedin.com/in/someone'

const design = (template: ResumeDesign['template'], extra: Partial<ResumeDesign> = {}): ResumeDesign => ({
  ...defaultDesign,
  template,
  ...extra,
})

describe('templates', () => {
  const simple = paths(render(<ResumePage content={full} />).container)

  it('has five ATS-safe templates and six fonts', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['standard', 'harvard', 'jake', 'professional', 'plain'])
    expect(FONTS).toHaveLength(6)
    for (const f of FONTS) expect(f.cssVar).toMatch(/^--font-resume-/)
  })

  it('renders every data-path of the Simple template, in every template, font and accent', () => {
    expect(simple.length).toBeGreaterThan(40)
    for (const t of TEMPLATES) {
      for (const accent of ['blue', 'black'] as const) {
        const { container } = render(<ResumePage content={full} design={design(t.id, { accent })} />)
        expect(paths(container), `${t.id} ${accent}`).toEqual(simple)
      }
    }
    for (const f of FONTS) {
      const { container } = render(<ResumePage content={full} design={design('standard', { font: f.id })} />)
      expect(paths(container)).toEqual(simple)
    }
  })

  it('keeps separators, standard headings, real text and a single column in every template', () => {
    for (const t of TEMPLATES) {
      const { container } = render(<ResumePage content={full} design={design(t.id)} />)
      expect(container.querySelectorAll('[data-sep]').length, t.id).toBeGreaterThan(5)
      expect([...container.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([
        'Summary',
        'Experience',
        'Projects',
        'Education',
        'Skills',
        'Certifications',
        'Awards',
      ])
      expect(container.querySelector('table')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('a[href="mailto:smrmehraj123@gmail.com"]')).not.toBeNull()
    }
  })

  it('gives every element that holds text a data-path or data-sep in every template', () => {
    for (const t of TEMPLATES) {
      const { container } = render(<ResumePage content={full} design={design(t.id)} editable />)
      for (const el of container.querySelectorAll('*')) {
        const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        if (ownText) expect(el.hasAttribute('data-path') || el.hasAttribute('data-sep'), t.id).toBe(true)
      }
    }
  })

  it('looks different in each template', () => {
    const htmls = TEMPLATES.map((t) => render(<ResumePage content={full} design={design(t.id)} />).container.innerHTML)
    expect(new Set(htmls).size).toBe(5)
  })

  it('uses the accent colour for Professional headings only', () => {
    const pro = render(<ResumePage content={full} design={design('professional')} />).container
    expect(pro.querySelector('h2')?.getAttribute('style')).toContain('rgb(37, 99, 235)')
    const black = render(<ResumePage content={full} design={design('professional', { accent: 'black' })} />).container
    expect(black.querySelector('h2')?.getAttribute('style')).toContain('rgb(15, 23, 42)')
    const std = render(<ResumePage content={full} design={design('standard')} />).container
    expect(std.querySelector('h2')?.getAttribute('style') ?? '').not.toContain('rgb(')
  })

  it('sets the font family from the chosen font and keeps a fallback', () => {
    const page = (font: ResumeDesign['font']) =>
      render(<ResumePage content={full} design={design('standard', { font })} />).container.querySelector(
        '.resume-page',
      ) as HTMLElement
    expect(fontStack('lato')).toContain('var(--font-resume-lato,')
    expect(fontStack('eb-garamond')).toContain('serif')
    expect(fontStack('roboto')).toContain('sans-serif')
    expect(page('lato').getAttribute('style')).toContain('--font-resume-lato')
    expect(page('source-serif').getAttribute('style')).toContain('serif')
  })

  it('still renders with the old props, at A4 size', () => {
    const { container } = render(<ResumePage content={full} className="shadow" />)
    const page = container.querySelector('.resume-page') as HTMLElement
    expect(page.className).toContain('shadow')
    expect(page.style.width).toBe('794px')
    expect(page.style.minHeight).toBe('1123px')
  })
})

describe('editable mode', () => {
  it('makes data-path elements contentEditable, except headings (custom.title stays editable)', () => {
    for (const t of TEMPLATES) {
      const { container } = render(<ResumePage content={full} design={design(t.id)} editable />)
      for (const el of container.querySelectorAll('[data-path]')) {
        const p = el.getAttribute('data-path') as string
        if (p.endsWith('.heading')) {
          expect(el.hasAttribute('contenteditable'), p).toBe(false)
        } else {
          expect(el.getAttribute('contenteditable'), p).toBe('plaintext-only')
          expect(el.getAttribute('tabindex'), p).toBe('0')
          expect(el.getAttribute('spellcheck'), p).toBe('true')
        }
      }
      expect(container.querySelector('[data-path="custom.title"]')?.getAttribute('contenteditable')).toBe(
        'plaintext-only',
      )
    }
  })

  it('is not editable by default', () => {
    const { container } = render(<ResumePage content={full} />)
    expect(container.querySelector('[contenteditable]')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
  })

  it('has no links, so a click edits instead of navigating', () => {
    for (const t of TEMPLATES) {
      const { container } = render(<ResumePage content={full} design={design(t.id)} editable />)
      expect(container.querySelector('a')).toBeNull()
      expect(container.querySelector('[data-path="contact.email"]')?.tagName).toBe('SPAN')
      expect(container.querySelector('[data-path="contact.email"]')?.textContent).toBe('smrmehraj123@gmail.com')
    }
  })
})

describe('data-block', () => {
  it('wraps each block, named as blockOf names it', () => {
    const { container } = render(<ResumePage content={full} />)
    const blocks = [...container.querySelectorAll('[data-block]')].map((e) => e.getAttribute('data-block'))
    expect(new Set(blocks).size).toBe(blocks.length)
    expect(blocks).toContain('contact')
    expect(blocks).toContain('summary')
    expect(blocks).toContain('custom')
    expect(blocks).toContain('experience.exp-parallel-labs')
    expect(blocks).toContain('skills.sk-lang')
    // every path sits inside the block blockOf names for it (headings aside)
    for (const el of container.querySelectorAll('[data-path]')) {
      const p = el.getAttribute('data-path') as string
      if (p.endsWith('.heading')) continue
      const wrapper = el.closest(`[data-block="${blockOf(p)}"]`)
      expect(wrapper, p).not.toBeNull()
    }
  })

  it('marks blocks for certifications, projects and education items too', () => {
    const { container } = render(<ResumePage content={full} />)
    for (const s of ['projects', 'education', 'certifications'] as const) {
      const id = full[s].items[0].id
      expect(container.querySelector(`[data-block="${s}.${id}"]`), s).not.toBeNull()
    }
  })
})

describe('ResumeBlock', () => {
  it('renders only the one block', () => {
    const id = full.experience.items[0].id
    const { container } = render(<ResumeBlock content={full} block={`experience.${id}`} />)
    const found = paths(container)
    expect(found.length).toBeGreaterThan(3)
    expect(found.every((p) => p.startsWith(`experience.${id}.`))).toBe(true)
    expect(container.querySelectorAll('[data-block]')).toHaveLength(1)
    expect(container.querySelector('[contenteditable]')).toBeNull()
  })

  it('renders every kind of block in every template', () => {
    const blocks = [
      'contact',
      'summary',
      'custom',
      `experience.${full.experience.items[0].id}`,
      `projects.${full.projects.items[0].id}`,
      `education.${full.education.items[0].id}`,
      `skills.${full.skills.groups[0].id}`,
      `certifications.${full.certifications.items[0].id}`,
    ]
    for (const t of TEMPLATES) {
      for (const block of blocks) {
        const { container } = render(<ResumeBlock content={full} design={design(t.id)} block={block} />)
        const found = paths(container).filter((p) => !p.endsWith('.heading') && p !== 'custom.title')
        expect(found.length, `${t.id} ${block}`).toBeGreaterThan(0)
        expect(found.every((p) => blockOf(p) === block)).toBe(true)
      }
    }
  })

  it('returns null for an unknown block', () => {
    for (const block of ['', 'nope', 'experience.nope', 'skills', 'summary.x', 'experience']) {
      const { container } = render(<ResumeBlock content={full} block={block} />)
      expect(container.innerHTML, block).toBe('')
    }
  })
})

describe('toDesign', () => {
  it('passes a valid design through', () => {
    const d: ResumeDesign = { template: 'harvard', font: 'lato', accent: 'black' }
    expect(toDesign(d)).toEqual(d)
  })

  it('falls back to the defaults on bad input', () => {
    expect(toDesign(null)).toEqual(defaultDesign)
    expect(toDesign(undefined)).toEqual(defaultDesign)
    expect(toDesign('harvard')).toEqual(defaultDesign)
    expect(toDesign(42)).toEqual(defaultDesign)
    expect(toDesign({})).toEqual(defaultDesign)
    expect(toDesign({ template: 'fancy', font: 7, accent: 'red' })).toEqual(defaultDesign)
  })

  it('maps the old template names to the closest new one', () => {
    expect(toDesign({ template: 'simple' }).template).toBe('standard')
    expect(toDesign({ template: 'compact' }).template).toBe('jake')
    expect(toDesign({ template: 'classic' }).template).toBe('harvard')
    expect(toDesign({ template: 'modern' }).template).toBe('professional')
    expect(toDesign({ template: 'bold' }).template).toBe('standard')
    expect(toDesign({ template: 'minimal' }).template).toBe('plain')
  })

  it('falls back field by field', () => {
    expect(toDesign({ template: 'jake', font: 'comic-sans', accent: 'black' })).toEqual({
      template: 'jake',
      font: 'inter',
      accent: 'black',
    })
  })
})
