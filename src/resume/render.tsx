import type { ReactNode } from 'react'
import { ACCENT_COLORS, defaultDesign, fontStack, type ResumeDesign } from './design'
import { THEMES, headingStyle, type Theme } from './themes'
import type { Bullet, ResumeContent, SectionKey } from './types'

/*
 * The resume templates (Standard, Harvard, Jake, Professional, Plain): one column, real text, standard
 * section names, no tables for layout. They share this structure and differ only in the classes and colours
 * of themes.ts. It is a server-safe component (no hooks, no browser APIs) so it can render on the server,
 * in tests and inside the editor's preview.
 *
 * Every piece of text sits in an element with a `data-path`, such as
 * `experience.exp-parallel-labs.bullets.b-pl-1`. The editor uses these to jump from the page to the
 * matching form field and to edit text in place. The few joining characters (dashes, commas) carry
 * `data-sep` instead, because they are not editable.
 *
 * Each block (contact, summary, one experience item, one skills group, ...) sits in an element with
 * `data-block`, named as in `blockOf` (paths.ts). In `editable` mode every text field is contentEditable
 * and links become plain spans, so a click edits instead of navigating.
 */

const SECTION_TITLES: Record<Exclude<SectionKey, 'contact' | 'custom'>, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
}

/** What every piece needs to draw itself: the template's classes, the accent colour and whether text is editable. */
type R = { t: Theme; design: ResumeDesign; accent: string; editable: boolean }

const makeR = (design: ResumeDesign, editable: boolean): R => ({
  t: THEMES[design.template],
  design,
  accent: ACCENT_COLORS[design.accent],
  editable,
})

const path = (...parts: string[]) => parts.join('.')

const EDIT_PROPS = {
  contentEditable: 'plaintext-only',
  suppressContentEditableWarning: true,
  spellCheck: true,
  tabIndex: 0,
} as const

const edit = (r: R) => (r.editable ? EDIT_PROPS : {})

/** A joining character between two editable fields. */
function Sep({ children }: { children: ReactNode }) {
  return <span data-sep>{children}</span>
}

function Text({ r, path, className, children }: { r: R; path: string; className?: string; children: string }) {
  return (
    <span data-path={path} className={className} {...edit(r)}>
      {children}
    </span>
  )
}

function Heading({ r, path, children, editable }: { r: R; path: string; children: string; editable?: boolean }) {
  return (
    <h2
      data-path={path}
      className={r.t.heading}
      style={headingStyle(r.design.template, r.accent)}
      {...(editable ? edit(r) : {})}
    >
      {children}
    </h2>
  )
}

function Bullets({ r, base, bullets }: { r: R; base: string; bullets: Bullet[] }) {
  if (!bullets.length) return null
  return (
    <ul className={r.t.bullets}>
      {bullets.map((b) => (
        <li key={b.id} data-path={path(base, 'bullets', b.id)} {...edit(r)}>
          {b.text}
        </li>
      ))}
    </ul>
  )
}

/** Two pieces of text on one line, the second pushed to the right edge. */
function Line({ r, left, right, block }: { r: R; left: ReactNode; right?: ReactNode; block?: string }) {
  return (
    <div data-block={block} className="flex items-baseline justify-between gap-4">
      <div>{left}</div>
      {right ? <div className={`shrink-0 text-right ${r.t.meta}`}>{right}</div> : null}
    </div>
  )
}

function Dates({ r, base, start, end }: { r: R; base: string; start: string; end: string }) {
  if (!start && !end) return null
  return (
    <>
      {start ? (
        <Text r={r} path={path(base, 'start')}>
          {start}
        </Text>
      ) : null}
      {start && end ? <Sep> – </Sep> : null}
      {end ? (
        <Text r={r} path={path(base, 'end')}>
          {end}
        </Text>
      ) : null}
    </>
  )
}

function href(value: string, kind: 'mail' | 'web'): string | null {
  if (!value || value.startsWith('TODO')) return null
  if (kind === 'mail') return `mailto:${value}`
  return /^https?:\/\//.test(value) ? value : `https://${value}`
}

function ContactBlock({ r, c }: { r: R; c: ResumeContent['contact'] }) {
  const fields: { key: 'location' | 'email' | 'github' | 'linkedin' | 'website'; link?: 'mail' | 'web' }[] = [
    { key: 'location' },
    { key: 'email', link: 'mail' },
    { key: 'github', link: 'web' },
    { key: 'linkedin', link: 'web' },
    { key: 'website', link: 'web' },
  ]
  const shown = fields.filter((f) => c[f.key])
  return (
    <header data-block="contact" className={r.t.header}>
      <h1 data-path="contact.name" className={r.t.name} {...edit(r)}>
        {c.name}
      </h1>
      {c.title ? (
        <p data-path="contact.title" className={r.t.title} {...edit(r)}>
          {c.title}
        </p>
      ) : null}
      {shown.length ? (
        <p className={r.t.contact}>
          {shown.map((f, i) => {
            const value = c[f.key]
            // In editable mode a link would navigate on click, so it stays a plain span.
            const url = f.link && !r.editable ? href(value, f.link) : null
            return (
              <span key={f.key}>
                {i > 0 ? <Sep> | </Sep> : null}
                {url ? (
                  <a data-path={path('contact', f.key)} href={url} className={r.t.muted}>
                    {value}
                  </a>
                ) : (
                  <Text r={r} path={path('contact', f.key)}>
                    {value}
                  </Text>
                )}
              </span>
            )
          })}
        </p>
      ) : null}
    </header>
  )
}

function SummaryBlock({ r, c }: { r: R; c: ResumeContent }) {
  if (!c.summary.text) return null
  return (
    <section data-block="summary">
      <Heading r={r} path="summary.heading">
        {SECTION_TITLES.summary}
      </Heading>
      <p data-path="summary.text" {...edit(r)}>
        {c.summary.text}
      </p>
    </section>
  )
}

function ExperienceBlock({ r, item }: { r: R; item: ResumeContent['experience']['items'][number] }) {
  const base = path('experience', item.id)
  return (
    <article data-block={base}>
      <Line
        r={r}
        left={
          <Text r={r} path={path(base, 'company')} className={r.t.strong}>
            {item.company}
          </Text>
        }
        right={
          item.location ? (
            <Text r={r} path={path(base, 'location')}>
              {item.location}
            </Text>
          ) : null
        }
      />
      <Line
        r={r}
        left={
          <Text r={r} path={path(base, 'role')}>
            {item.role}
          </Text>
        }
        right={<Dates r={r} base={base} start={item.start} end={item.end} />}
      />
      <Bullets r={r} base={base} bullets={item.bullets} />
    </article>
  )
}

function ProjectBlock({ r, item }: { r: R; item: ResumeContent['projects']['items'][number] }) {
  const base = path('projects', item.id)
  return (
    <article data-block={base}>
      <Line
        r={r}
        left={
          <>
            <Text r={r} path={path(base, 'name')} className={r.t.strong}>
              {item.name}
            </Text>
            {item.stack ? (
              <>
                <Sep> | </Sep>
                <Text r={r} path={path(base, 'stack')} className={r.t.muted}>
                  {item.stack}
                </Text>
              </>
            ) : null}
          </>
        }
        right={
          item.dates ? (
            <Text r={r} path={path(base, 'dates')}>
              {item.dates}
            </Text>
          ) : null
        }
      />
      <Bullets r={r} base={base} bullets={item.bullets} />
    </article>
  )
}

function EducationBlock({ r, item }: { r: R; item: ResumeContent['education']['items'][number] }) {
  const base = path('education', item.id)
  return (
    <article data-block={base}>
      <Line
        r={r}
        left={
          <Text r={r} path={path(base, 'school')} className={r.t.strong}>
            {item.school}
          </Text>
        }
        right={
          item.location ? (
            <Text r={r} path={path(base, 'location')}>
              {item.location}
            </Text>
          ) : null
        }
      />
      <Line
        r={r}
        left={
          <Text r={r} path={path(base, 'degree')}>
            {item.degree}
          </Text>
        }
        right={<Dates r={r} base={base} start={item.start} end={item.end} />}
      />
      {item.score ? (
        <p className={r.t.muted}>
          <Text r={r} path={path(base, 'score')}>
            {item.score}
          </Text>
        </p>
      ) : null}
      <Bullets r={r} base={base} bullets={item.bullets} />
    </article>
  )
}

function SkillsBlock({ r, group: g }: { r: R; group: ResumeContent['skills']['groups'][number] }) {
  const base = path('skills', g.id)
  return (
    <p data-block={base}>
      <Text r={r} path={path(base, 'label')} className={r.t.strong}>
        {g.label}
      </Text>
      <Sep>: </Sep>
      {g.items.map((s, i) => (
        <span key={s.id}>
          {i > 0 ? <Sep>, </Sep> : null}
          <Text r={r} path={path(base, 'items', s.id)}>
            {s.name}
          </Text>
        </span>
      ))}
    </p>
  )
}

function CertificationBlock({ r, item }: { r: R; item: ResumeContent['certifications']['items'][number] }) {
  const base = path('certifications', item.id)
  return (
    <Line
      r={r}
      block={base}
      left={
        <>
          <Text r={r} path={path(base, 'name')} className={r.t.strong}>
            {item.name}
          </Text>
          {item.issuer ? (
            <>
              <Sep>, </Sep>
              <Text r={r} path={path(base, 'issuer')}>
                {item.issuer}
              </Text>
            </>
          ) : null}
        </>
      }
      right={
        item.date ? (
          <Text r={r} path={path(base, 'date')}>
            {item.date}
          </Text>
        ) : null
      }
    />
  )
}

function CustomBlock({ r, c }: { r: R; c: ResumeContent }) {
  if (!c.custom.bullets.length) return null
  return (
    <section data-block="custom">
      <Heading r={r} path="custom.title" editable>
        {c.custom.title || 'Additional'}
      </Heading>
      <Bullets r={r} base="custom" bullets={c.custom.bullets} />
    </section>
  )
}

function Section({ r, name, c }: { r: R; name: SectionKey; c: ResumeContent }) {
  const { t } = r
  switch (name) {
    case 'contact':
      return null // drawn once at the top of the page, whatever its place in the order
    case 'summary':
      return <SummaryBlock r={r} c={c} />
    case 'experience':
      return c.experience.items.length ? (
        <section>
          <Heading r={r} path="experience.heading">
            {SECTION_TITLES.experience}
          </Heading>
          <div className={t.gapLarge}>
            {c.experience.items.map((item) => (
              <ExperienceBlock key={item.id} r={r} item={item} />
            ))}
          </div>
        </section>
      ) : null
    case 'projects':
      return c.projects.items.length ? (
        <section>
          <Heading r={r} path="projects.heading">
            {SECTION_TITLES.projects}
          </Heading>
          <div className={t.gapSmall}>
            {c.projects.items.map((item) => (
              <ProjectBlock key={item.id} r={r} item={item} />
            ))}
          </div>
        </section>
      ) : null
    case 'education':
      return c.education.items.length ? (
        <section>
          <Heading r={r} path="education.heading">
            {SECTION_TITLES.education}
          </Heading>
          <div className={t.gapSmall}>
            {c.education.items.map((item) => (
              <EducationBlock key={item.id} r={r} item={item} />
            ))}
          </div>
        </section>
      ) : null
    case 'skills': {
      const groups = c.skills.groups.filter((g) => g.items.length)
      return groups.length ? (
        <section>
          <Heading r={r} path="skills.heading">
            {SECTION_TITLES.skills}
          </Heading>
          <div className={t.gapTight}>
            {groups.map((g) => (
              <SkillsBlock key={g.id} r={r} group={g} />
            ))}
          </div>
        </section>
      ) : null
    }
    case 'certifications':
      return c.certifications.items.length ? (
        <section>
          <Heading r={r} path="certifications.heading">
            {SECTION_TITLES.certifications}
          </Heading>
          <div className={t.gapTight}>
            {c.certifications.items.map((item) => (
              <CertificationBlock key={item.id} r={r} item={item} />
            ))}
          </div>
        </section>
      ) : null
    case 'custom':
      return <CustomBlock r={r} c={c} />
  }
}

/** A resume as a white A4 page (794 × 1123 px at 96 dpi; it grows taller if the content needs it). */
export function ResumePage({
  content,
  className,
  design = defaultDesign,
  editable = false,
}: {
  content: ResumeContent
  className?: string
  design?: ResumeDesign
  editable?: boolean
}) {
  const r = makeR(design, editable)
  const sections = content.order.filter((key) => !content[key].hidden)
  return (
    <article
      className={`resume-page bg-white text-ink ${r.t.page} ${className ?? ''}`}
      style={{ width: 794, minHeight: 1123, fontFamily: fontStack(design.font) }}
    >
      {content.contact.hidden ? null : <ContactBlock r={r} c={content.contact} />}
      {sections.map((key) => (
        <Section key={key} r={r} name={key} c={content} />
      ))}
    </article>
  )
}

/** The element for one block, found by its name ("contact", "experience.<itemId>", "skills.<groupId>", "custom", ...). */
function blockElement(r: R, c: ResumeContent, block: string): ReactNode {
  const [section, id] = block.split('.')
  switch (section) {
    case 'contact':
      return id ? null : <ContactBlock r={r} c={c.contact} />
    case 'summary':
      return id ? null : <SummaryBlock r={r} c={c} />
    case 'custom':
      return id ? null : <CustomBlock r={r} c={c} />
    case 'experience': {
      const item = c.experience.items.find((i) => i.id === id)
      return item ? <ExperienceBlock r={r} item={item} /> : null
    }
    case 'projects': {
      const item = c.projects.items.find((i) => i.id === id)
      return item ? <ProjectBlock r={r} item={item} /> : null
    }
    case 'education': {
      const item = c.education.items.find((i) => i.id === id)
      return item ? <EducationBlock r={r} item={item} /> : null
    }
    case 'skills': {
      const group = c.skills.groups.find((g) => g.id === id)
      return group ? <SkillsBlock r={r} group={group} /> : null
    }
    case 'certifications': {
      const item = c.certifications.items.find((i) => i.id === id)
      return item ? <CertificationBlock r={r} item={item} /> : null
    }
    default:
      return null
  }
}

/**
 * Only one block, in the template's styling and not editable: a close-up for the editor.
 * It keeps the page's width, side margins and font, so text wraps as it does on the page.
 * Unknown blocks give null.
 */
export function ResumeBlock({
  content,
  design = defaultDesign,
  block,
}: {
  content: ResumeContent
  design?: ResumeDesign
  block: string
}) {
  const r = makeR(design, false)
  const element = blockElement(r, content, block)
  if (!element) return null
  return (
    <div
      className={`resume-block bg-white text-ink ${r.t.page}`}
      style={{ width: 794, paddingTop: 16, paddingBottom: 16, fontFamily: fontStack(design.font) }}
    >
      {element}
    </div>
  )
}
