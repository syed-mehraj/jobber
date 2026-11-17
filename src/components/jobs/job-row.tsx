import Link from 'next/link'
import { ApplyButton } from '@/components/dashboard/apply-button'
import { cx } from '@/lib/cx'
import type { JobRow } from '@/lib/data'
import { ageInDays, levelLabel, shortAge, sourceLabel } from '@/lib/format'
import { bandText, scoreBand } from '@/lib/score'
import { isUnofficial } from '@/jobs/unofficial'
import { COUNTRY_FLAGS, type CountryCode } from '@/jobs/countries'

/**
 * One job. Line 1: role (opens the fit panel) and New. Line 2: company · location.
 * Line 3: where Apply goes, how old the posting is (amber past 30 days) and the level.
 * Right: the match % in a status colour (never the action blue) and Apply.
 */
export function JobRowItem({ job, href, selected = false }: { job: JobRow; href: string; selected?: boolean }) {
  const age = ageInDays(job.postedAt ?? job.firstSeenAt)
  const stale = age !== null && age > 30
  return (
    <li
      className={cx(
        'relative grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[36px_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5',
        selected ? 'bg-primary-tint/60 shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-surface-muted',
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-control border border-line bg-surface-muted text-small font-semibold text-ink-2"
      >
        {job.company.trim()[0]?.toUpperCase() ?? '?'}
      </span>
      <span className="min-w-0">
        <Link
          href={href}
          scroll={false}
          aria-current={selected ? 'true' : undefined}
          data-job-link
          className="flex items-center gap-2 font-medium hover:text-primary"
        >
          <span className="truncate">{job.title}</span>
          {job.isNew && (
            <span className="shrink-0 rounded-full bg-primary-tint px-2 text-caption leading-5 font-semibold text-primary">
              New
            </span>
          )}
        </Link>
        <span className="block truncate text-small text-ink-2">
          {job.company} ·{' '}
          {job.country && job.country !== 'IN' ? `${COUNTRY_FLAGS[job.country as CountryCode] ?? ''} ` : ''}
          {job.location}
        </span>
        <span className="mt-0.5 block truncate text-caption text-ink-3">
          {sourceLabel[job.sourceKind] ?? job.source}
          {isUnofficial(job.sourceKind) && ' (unofficial)'}
          {' · '}
          <span className={cx(stale && 'font-medium text-warning')}>
            {job.postedAt ? `posted ${shortAge(job.postedAt)}` : `seen ${shortAge(job.firstSeenAt)}`}
            {stale && ' (may be stale)'}
          </span>
          {' · '}
          {levelLabel[job.level]}
        </span>
      </span>
      <span className="flex flex-col items-end text-caption text-ink-3">
        <strong className={cx('text-large font-semibold tabular-nums', bandText[scoreBand(job.score)])}>
          {job.score}%
        </strong>
        match
      </span>
      <span className="col-start-2 col-end-[-1] sm:col-auto">
        <ApplyButton jobId={job.id} url={job.url} label={`${job.title} at ${job.company}`} applied={job.applied} />
      </span>
    </li>
  )
}
