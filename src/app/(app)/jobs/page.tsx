import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { JobRowItem } from '@/components/jobs/job-row'
import { RunSearchButton } from '@/components/jobs/run-search-button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import type { Level, Region } from '@/db/schema'
import { cx } from '@/lib/cx'
import { getJobs, getSearchStatus, refreshIfStale, type JobFilter } from '@/lib/data'
import { timeAgo } from '@/lib/format'
import { runSearchNow } from '../actions'

export const metadata: Metadata = { title: 'Jobs' }

const LEVELS: [Level | 'all', string][] = [
  ['all', 'All levels'],
  ['intern', 'Internships'],
  ['new-grad', 'New grad'],
  ['entry', 'Entry level'],
  ['unspecified', 'Level not stated'],
]
const REGIONS: [Region | 'all', string][] = [
  ['all', 'Anywhere'],
  ['hyderabad', 'Hyderabad'],
  ['india', 'India'],
  ['remote', 'Remote'],
  ['international', 'Abroad'],
]
const CATEGORIES = ['all', 'ML / AI', 'Backend', 'SDE', 'Full-stack', 'Frontend', 'Mobile', 'Data', 'Infra']

type Search = { level?: string; region?: string; category?: string; sort?: string }

export default function JobsPage({ searchParams }: PageProps<'/jobs'>) {
  return (
    <>
      <PageHeader
        title="Jobs"
        text="Open roles that passed the filters, best match first."
        action={<RunSearchButton run={runSearchNow} />}
      />
      <Suspense fallback={<JobsSkeleton />}>
        <JobsList searchParams={searchParams as Promise<Search>} />
      </Suspense>
    </>
  )
}

function href(current: Search, change: Partial<Search>): string {
  const next = { ...current, ...change }
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) if (v && v !== 'all' && !(k === 'sort' && v === 'best')) q.set(k, v)
  const s = q.toString()
  return s ? `/jobs?${s}` : '/jobs'
}

function Chips<T extends string>({
  label,
  options,
  value,
  param,
  current,
}: {
  label: string
  options: [T, string][]
  value: string
  param: keyof Search
  current: Search
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(([v, text]) => (
        <Link
          key={v}
          href={href(current, { [param]: v })}
          aria-current={value === v ? 'true' : undefined}
          className={cx(
            'inline-flex h-8 items-center rounded-full border px-3 text-small font-medium transition-colors',
            value === v
              ? 'border-primary-tint-border bg-primary-tint text-primary'
              : 'border-line bg-surface text-ink-2 hover:text-ink',
          )}
        >
          {text}
        </Link>
      ))}
    </div>
  )
}

async function JobsList({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  await refreshIfStale()
  const filter: JobFilter = {
    level: (sp.level as Level) ?? 'all',
    region: (sp.region as Region) ?? 'all',
    category: sp.category ?? 'all',
    sort: sp.sort === 'newest' ? 'newest' : 'best',
  }
  const [{ rows, total }, status] = await Promise.all([getJobs(filter), getSearchStatus()])

  return (
    <>
      <div className="grid gap-2.5">
        <Chips label="Level" options={LEVELS} value={filter.level ?? 'all'} param="level" current={sp} />
        <Chips label="Where" options={REGIONS} value={filter.region ?? 'all'} param="region" current={sp} />
        <Chips
          label="Kind of role"
          options={CATEGORIES.map((c) => [c, c === 'all' ? 'All roles' : c] as [string, string])}
          value={filter.category ?? 'all'}
          param="category"
          current={sp}
        />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-2 text-small text-ink-2">
        <span>
          {total} open role{total === 1 ? '' : 's'}
          {status.lastRunAt && <> · last search {timeAgo(status.lastRunAt)}</>}
          {status.running && <> · searching now</>}
        </span>
        <span className="flex gap-3">
          <Link
            href={href(sp, { sort: 'best' })}
            aria-current={filter.sort === 'best' ? 'true' : undefined}
            className={cx('font-medium', filter.sort === 'best' ? 'text-primary' : 'hover:text-ink')}
          >
            Best match
          </Link>
          <Link
            href={href(sp, { sort: 'newest' })}
            aria-current={filter.sort === 'newest' ? 'true' : undefined}
            className={cx('font-medium', filter.sort === 'newest' ? 'text-primary' : 'hover:text-ink')}
          >
            Newest
          </Link>
        </span>
      </div>

      <Card>
        {rows.length ? (
          <ul>
            {rows.map((job) => (
              <JobRowItem key={job.id} job={job} detailed isNew={job.isNew} />
            ))}
          </ul>
        ) : (
          <p className="px-6 py-12 text-center text-ink-2">
            {status.lastRunAt ? 'Nothing matches these filters right now.' : 'No search has run yet. Run one above.'}
          </p>
        )}
      </Card>
      {total > rows.length && (
        <p className="mt-3 text-small text-ink-3">Showing the top {rows.length}. Narrow the filters to see others.</p>
      )}
    </>
  )
}

function JobsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-full max-w-xl rounded-full" />
      <Skeleton className="mt-2.5 h-8 w-full max-w-lg rounded-full" />
      <Skeleton className="mt-6 h-[480px] rounded-card" />
    </div>
  )
}
