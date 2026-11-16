import type { ReactNode } from 'react'
import type { Bullet, ResumeContent, SectionKey } from './types'

/*
 * The "Simple" template: one column, real text, standard section names, Inter, no tables for layout.
 * It is a server-safe component (no hooks, no browser APIs) so it can render on the server, in tests
 * and later inside the editor's preview.
 *
 * Every piece of text sits in an element with a `data-path`, such as
 * `experience.exp-parallel-labs.bullets.b-pl-1`. The editor uses these to jump from the page to the
 * matching form field and to edit text in place. The few joining characters (dashes, commas) carry
 * `data-sep` instead, because they are not editable.
 */

const SECTION_TITLES: Record<Exclude<SectionKey, 'contact' | 'custom'>, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
}

const path = (...parts: string[]) => parts.join('.')

/** A joining character between two editable fields. */
function Sep({ children }: { children: ReactNode }) {
  return <span data-sep>{children}</span>
}

function Text({ path, className, children }: { path: string; className?: string; children: string }) {
  return (
    <span data-path={path} className={className}>
      {children}
    </span>
  )
}

function Heading({ path, children }: { path: string; children: string }) {
  return (
    <h2
      data-path={path}
      className="mt-[18px] mb-2 border-b border-line-strong pb-1 text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink uppercase"
    >
      {children}
    </h2>
  )
}

function Bullets({ base, bullets }: { base: string; bullets: Bullet[] }) {
  if (!bullets.length) return null
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-[18px]">
      {bullets.map((b) => (
        <li key={b.id} data-path={path(base, 'bullets', b.id)}>
          {b.text}
        </li>
      ))}
    </ul>
  )
}

/** Two pieces of text on one line, the second pushed to the right edge. */
function Line({ left, right, className }: { left: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${className ?? ''}`}>
      <div>{left}</div>
      {right ? <div className="shrink-0 text-right text-ink-2">{right}</div> : null}
    </div>
  )
}

function Dates({ base, start, end }: { base: string; start: string; end: string }) {
  if (!start && !end) return null
  return (
    <>
      {start ? <Text path={path(base, 'start')}>{start}</Text> : null}
      {start && end ? <Sep> – </Sep> : null}
      {end ? <Text path={path(base, 'end')}>{end}</Text> : null}
    </>
  )
}

function href(value: string, kind: 'mail' | 'web'): string | null {
  if (!value || value.startsWith('TODO')) return null
  if (kind === 'mail') return `mailto:${value}`
  return /^https?:\/\//.test(value) ? value : `https://${value}`
}

function Contact({ c }: { c: ResumeContent['contact'] }) {
  const fields: { key: 'location' | 'email' | 'github' | 'linkedin' | 'website'; link?: 'mail' | 'web' }[] = [
    { key: 'location' },
    { key: 'email', link: 'mail' },
    { key: 'github', link: 'web' },
    { key: 'linkedin', link: 'web' },
    { key: 'website', link: 'web' },
  ]
  const shown = fields.filter((f) => c[f.key])
  return (
    <header>
      <h1 data-path="contact.name" className="text-[26px] leading-8 font-semibold tracking-[-0.01em]">
        {c.name}
      </h1>
      {c.title ? (
        <p data-path="contact.title" className="mt-0.5 text-[13px] text-ink-2">
          {c.title}
        </p>
      ) : null}
      {shown.length ? (
        <p className="mt-1.5 text-ink-2">
          {shown.map((f, i) => {
            const value = c[f.key]
            const url = f.link ? href(value, f.link) : null
            return (
              <span key={f.key}>
                {i > 0 ? <Sep> | </Sep> : null}
                {url ? (
                  <a data-path={path('contact', f.key)} href={url} className="text-ink-2">
                    {value}
                  </a>
                ) : (
                  <Text path={path('contact', f.key)}>{value}</Text>
                )}
              </span>
            )
          })}
        </p>
      ) : null}
    </header>
  )
}

function Section({ name, c }: { name: SectionKey; c: ResumeContent }) {
  switch (name) {
    case 'contact':
      return null // drawn once at the top of the page, whatever its place in the order
    case 'summary':
      return c.summary.text ? (
        <section>
          <Heading path="summary.heading">{SECTION_TITLES.summary}</Heading>
          <p data-path="summary.text">{c.summary.text}</p>
        </section>
      ) : null
    case 'experience':
      return c.experience.items.length ? (
        <section>
          <Heading path="experience.heading">{SECTION_TITLES.experience}</Heading>
          <div className="space-y-3">
            {c.experience.items.map((item) => {
              const base = path('experience', item.id)
              return (
                <article key={item.id}>
                  <Line
                    left={
                      <Text path={path(base, 'company')} className="font-semibold">
                        {item.company}
                      </Text>
                    }
                    right={item.location ? <Text path={path(base, 'location')}>{item.location}</Text> : null}
                  />
                  <Line
                    left={<Text path={path(base, 'role')}>{item.role}</Text>}
                    right={<Dates base={base} start={item.start} end={item.end} />}
                  />
                  <Bullets base={base} bullets={item.bullets} />
                </article>
              )
            })}
          </div>
        </section>
      ) : null
    case 'projects':
      return c.projects.items.length ? (
        <section>
          <Heading path="projects.heading">{SECTION_TITLES.projects}</Heading>
          <div className="space-y-2.5">
            {c.projects.items.map((item) => {
              const base = path('projects', item.id)
              return (
                <article key={item.id}>
                  <Line
                    left={
                      <>
                        <Text path={path(base, 'name')} className="font-semibold">
                          {item.name}
                        </Text>
                        {item.stack ? (
                          <>
                            <Sep> | </Sep>
                            <Text path={path(base, 'stack')} className="text-ink-2">
                              {item.stack}
                            </Text>
                          </>
                        ) : null}
                      </>
                    }
                    right={item.dates ? <Text path={path(base, 'dates')}>{item.dates}</Text> : null}
                  />
                  <Bullets base={base} bullets={item.bullets} />
                </article>
              )
            })}
          </div>
        </section>
      ) : null
    case 'education':
      return c.education.items.length ? (
        <section>
          <Heading path="education.heading">{SECTION_TITLES.education}</Heading>
          <div className="space-y-2.5">
            {c.education.items.map((item) => {
              const base = path('education', item.id)
              return (
                <article key={item.id}>
                  <Line
                    left={
                      <Text path={path(base, 'school')} className="font-semibold">
                        {item.school}
                      </Text>
                    }
                    right={item.location ? <Text path={path(base, 'location')}>{item.location}</Text> : null}
                  />
                  <Line
                    left={<Text path={path(base, 'degree')}>{item.degree}</Text>}
                    right={<Dates base={base} start={item.start} end={item.end} />}
                  />
                  {item.score ? (
                    <p className="text-ink-2">
                      <Text path={path(base, 'score')}>{item.score}</Text>
                    </p>
                  ) : null}
                  <Bullets base={base} bullets={item.bullets} />
                </article>
              )
            })}
          </div>
        </section>
      ) : null
    case 'skills': {
      const groups = c.skills.groups.filter((g) => g.items.length)
      return groups.length ? (
        <section>
          <Heading path="skills.heading">{SECTION_TITLES.skills}</Heading>
          <div className="space-y-0.5">
            {groups.map((g) => {
              const base = path('skills', g.id)
              return (
                <p key={g.id}>
                  <Text path={path(base, 'label')} className="font-semibold">
                    {g.label}
                  </Text>
                  <Sep>: </Sep>
                  {g.items.map((s, i) => (
                    <span key={s.id}>
                      {i > 0 ? <Sep>, </Sep> : null}
                      <Text path={path(base, 'items', s.id)}>{s.name}</Text>
                    </span>
                  ))}
                </p>
              )
            })}
          </div>
        </section>
      ) : null
    }
    case 'certifications':
      return c.certifications.items.length ? (
        <section>
          <Heading path="certifications.heading">{SECTION_TITLES.certifications}</Heading>
          <div className="space-y-0.5">
            {c.certifications.items.map((item) => {
              const base = path('certifications', item.id)
              return (
                <Line
                  key={item.id}
                  left={
                    <>
                      <Text path={path(base, 'name')} className="font-semibold">
                        {item.name}
                      </Text>
                      {item.issuer ? (
                        <>
                          <Sep>, </Sep>
                          <Text path={path(base, 'issuer')}>{item.issuer}</Text>
                        </>
                      ) : null}
                    </>
                  }
                  right={item.date ? <Text path={path(base, 'date')}>{item.date}</Text> : null}
                />
              )
            })}
          </div>
        </section>
      ) : null
    case 'custom':
      return c.custom.bullets.length ? (
        <section>
          <Heading path="custom.title">{c.custom.title || 'Additional'}</Heading>
          <Bullets base="custom" bullets={c.custom.bullets} />
        </section>
      ) : null
  }
}

/** A resume as a white A4 page (794 × 1123 px at 96 dpi; it grows taller if the content needs it). */
export function ResumePage({ content, className }: { content: ResumeContent; className?: string }) {
  const sections = content.order.filter((key) => !content[key].hidden)
  return (
    <article
      className={`resume-page bg-white px-14 py-[52px] font-sans text-[12.5px] leading-[1.5] text-ink ${className ?? ''}`}
      style={{ width: 794, minHeight: 1123 }}
    >
      {content.contact.hidden ? null : <Contact c={content.contact} />}
      {sections.map((key) => (
        <Section key={key} name={key} c={content} />
      ))}
    </article>
  )
}
