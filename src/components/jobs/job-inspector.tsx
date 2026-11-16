import Link from 'next/link'
import type { ReactNode } from 'react'
import { ApplyButton } from '@/components/dashboard/apply-button'
import { DismissButton } from '@/components/jobs/dismiss-button'
import { Badge } from '@/components/ui/badge'
import { iconButtonClass } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CloseIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import type { JobDetail } from '@/lib/data'
import { ageInDays, levelLabel, regionLabel, shortAge, sourceLabel } from '@/lib/format'
import { bandText, scoreBand } from '@/lib/score'

/**
 * The fit panel beside the job list: why a role matched, what it asks for, how fresh it is,
 * and the one thing to do next (Apply on the company's own page).
 */
export function JobInspector({ job, closeHref }: { job: JobDetail; closeHref?: string }) {
  const source = sourceLabel[job.sourceKind] ?? job.source
  const companyBoard = ['greenhouse', 'lever', 'ashby', 'smartrecruiters'].includes(job.sourceKind)
  const age = ageInDays(job.postedAt ?? job.firstSeenAt)
  const host = (() => {
    try {
      return new URL(job.url).host
    } catch {
      return job.url
    }
  })()

  return (
    <Card aria-labelledby="fit-title" className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-ink-2">
              {job.company} · {job.location}
            </p>
            <h2 id="fit-title" className="mt-0.5 text-title font-semibold">
              {job.title}
            </h2>
          </div>
          {closeHref && (
            <Link href={closeHref} scroll={false} aria-label="Close" className={iconButtonClass({ size: 'sm' })}>
              <CloseIcon />
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={job.level === 'unspecified' ? 'warning' : 'neutral'}>{levelLabel[job.level]}</Badge>
          <Badge>{job.category}</Badge>
          <Badge>{regionLabel[job.region]}</Badge>
          <Badge tone={age !== null && age > 30 ? 'warning' : 'neutral'}>
            {job.postedAt ? `Posted ${shortAge(job.postedAt)}` : `Seen ${shortAge(job.firstSeenAt)}`}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-4">
        <Section title="Why it matched">
          <p className="flex items-baseline gap-2">
            <strong className={cx('text-[28px] leading-8 font-semibold tabular-nums', bandText[scoreBand(job.score)])}>
              {job.score}%
            </strong>
            <span className="text-small text-ink-2">match</span>
          </p>
          <ul className="mt-2 grid gap-1 text-small text-ink-2">
            {job.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden="true" className="text-success">
                  +
                </span>
                {r}
              </li>
            ))}
            {job.flags.map((f) => (
              <li key={f} className="flex gap-2 text-warning">
                <span aria-hidden="true">!</span>
                {f}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Skills">
          {job.required.length ? (
            <>
              <p className="text-small text-ink-2">
                The posting names {job.required.length} skill{job.required.length === 1 ? '' : 's'}; your work covers{' '}
                {job.matched.length}.
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skills you have">
                {job.matched.map((s) => (
                  <li key={s}>
                    <Badge tone="success">+ {s}</Badge>
                  </li>
                ))}
              </ul>
              {job.missing.length > 0 && (
                <>
                  <p className="mt-3 text-small text-ink-2">Not on your resume yet:</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skills you are missing">
                    {job.missing.map((s) => (
                      <li key={s}>
                        <Badge tone="warning">- {s}</Badge>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="text-small text-ink-2">
              {job.summary
                ? 'The posting does not name specific skills. Read it before applying.'
                : 'This source gives no description, so skills could not be checked.'}
            </p>
          )}
        </Section>

        <Section title="Where Apply goes">
          <p className="text-small text-ink-2">
            {companyBoard ? (
              <>
                The company’s own {source} page (<span className="font-medium text-ink">{host}</span>), so your
                application goes straight to its recruiters.
              </>
            ) : (
              <>
                Found via {source}. The link opens <span className="font-medium text-ink">{host}</span>; check that it
                leads to the company’s own careers page.
              </>
            )}
          </p>
          {job.closed && <p className="mt-1 text-small font-medium text-danger">This posting has been taken down.</p>}
          {job.dismissed && (
            <p className="mt-1 text-small font-medium text-ink-2">
              You hid this role. Restore it to see it in the lists.
            </p>
          )}
        </Section>

        {job.summary && (
          <Section title="About the role">
            <details className="group text-small text-ink-2">
              <summary className="cursor-pointer list-none font-medium text-primary group-open:mb-2 hover:underline">
                <span className="group-open:hidden">Show the description</span>
                <span className="hidden group-open:inline">Hide the description</span>
              </summary>
              <p className="max-h-80 overflow-y-auto whitespace-pre-line">{job.summary}</p>
            </details>
          </Section>
        )}

        <p className="rounded-control bg-surface-muted px-3 py-2.5 text-small text-ink-2">
          Referrals turn into hires far more often than cold applications. If you know someone at {job.company}, ask
          them before you apply.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-muted px-5 py-3.5">
        <ApplyButton
          jobId={job.id}
          url={job.url}
          label={`${job.title} at ${job.company}`}
          applied={job.applied}
          prominent={companyBoard ? `Apply on ${source}` : 'Open the posting'}
        />
        <DismissButton jobId={job.id} dismissed={job.dismissed} />
      </div>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-caption font-semibold tracking-wide text-ink-3 uppercase">{title}</h3>
      {children}
    </section>
  )
}
