import { ApplyButton } from '@/components/dashboard/apply-button'
import { cx } from '@/lib/cx'
import type { JobRow } from '@/lib/data'
import { levelLabel, timeAgo } from '@/lib/format'
import { bandText, scoreBand } from '@/lib/score'

/** One job: logo initial, role, company · location, match %, Apply. `detailed` adds level, reasons and flags. */
export function JobRowItem({
  job,
  detailed = false,
  isNew = false,
}: {
  job: JobRow
  detailed?: boolean
  isNew?: boolean
}) {
  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface-muted sm:grid-cols-[40px_minmax(0,1fr)_auto_auto] sm:items-center sm:px-[22px] sm:py-3.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-[10px] bg-sunken font-semibold text-ink-2 sm:size-10"
      >
        {job.company.trim()[0]?.toUpperCase() ?? '?'}
      </span>
      <span className="min-w-0">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-medium hover:text-primary"
        >
          <span className="truncate">{job.title}</span>
          {isNew && (
            <span className="shrink-0 rounded-full bg-primary-tint px-2 text-caption leading-5 font-semibold text-primary">
              New
            </span>
          )}
        </a>
        <small className="block truncate text-[13.5px] text-ink-3">
          {job.company} · {job.location}
        </small>
        {detailed && (
          <small className="mt-1 block text-small text-ink-2">
            {levelLabel[job.level]} · {job.category} · seen {timeAgo(job.firstSeenAt)} · via {job.source}
            {job.reasons.length > 2 && <> · {job.reasons.slice(2).join(' · ')}</>}
            {job.flags.length > 0 && <span className="text-warning"> · {job.flags.join(' · ')}</span>}
          </small>
        )}
      </span>
      <span className="flex flex-col items-end text-caption text-ink-3">
        <strong className={cx('text-large font-semibold', bandText[scoreBand(job.score)])}>{job.score}%</strong>
        match
      </span>
      <span className="col-start-2 col-end-[-1] sm:col-auto">
        <ApplyButton jobId={job.id} url={job.url} label={`${job.title} at ${job.company}`} applied={job.applied} />
      </span>
    </li>
  )
}
