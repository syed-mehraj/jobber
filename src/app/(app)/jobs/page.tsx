import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { JobInspector } from '@/components/jobs/job-inspector'
import { JobKeys } from '@/components/jobs/job-keys'
import { JobRowItem } from '@/components/jobs/job-row'
import { RevealOnPhone } from '@/components/jobs/reveal-on-phone'
import { RunSearchButton } from '@/components/jobs/run-search-button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import type { Level, Region } from '@/db/schema'
import { cx } from '@/lib/cx'
import { getJob, getJobs, getScopeCounts, getSearchStatus, refreshIfStale, type JobFilter } from '@/lib/data'
import { COUNTRY_FLAGS, COUNTRY_NAMES, type CountryCode } from '@/jobs/countries'
import { CountryGuide } from '@/components/jobs/country-guide'
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
]
const CATEGORIES = ['all', 'ML / AI', 'Backend', 'SDE', 'Full-stack', 'Frontend', 'Mobile', 'Data', 'Infra']

type Search = {
  scope?: string
  level?: string
  region?: string
  country?: string
  category?: string
  sort?: string
  job?: string
}

export default function JobsPage({ searchParams }: PageProps<'/jobs'>) {
  return (
    <>
      <PageHeader
        title="Jobs"
        text="Open roles that passed your filters. Pick one to see why it matched."
        action={<RunSearchButton run={runSearchNow} />}
      />
      <Suspense fallback={<JobsSkeleton />}>
        <JobsWorkspace searchParams={searchParams as Promise<Search>} />
      </Suspense>
    </>
  )
}

/** A /jobs URL with the current filters and the given changes. Changing a filter clears the selected job. */
function href(current: Search, change: Partial<Search>): string {
  const next: Search = { ...current, ...change }
  if (!('job' in change)) delete next.job
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) if (v && v !== 'all' && !(k === 'sort' && v === 'best')) q.set(k, v)
  const s = q.toString()
  return s ? `/jobs?${s}` : '/jobs'
}

/** Two tabs: India & remote, or Abroad (roles with visa or relocation support). */
function ScopeTabs({ abroad, home, away }: { abroad: boolean; home: number; away: number }) {
  const tab = (on: boolean, href: string, label: string, n: number) => (
    <Link
      href={href}
      scroll={false}
      aria-current={on ? 'page' : undefined}
      className={cx(
        'relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-2.5 font-medium transition-colors',
        on ? 'border-primary text-primary' : 'border-transparent text-ink-2 hover:text-ink',
      )}
    >
      {label}
      <span className={cx('rounded-full px-2 text-caption leading-5', on ? 'bg-primary-tint' : 'bg-sunken')}>{n}</span>
    </Link>
  )
  return (
    <nav aria-label="Where" className="mb-4 flex gap-6 border-b border-line">
      {tab(!abroad, '/jobs', 'India & remote', home)}
      {tab(abroad, '/jobs?scope=abroad', 'Abroad · visa or relocation', away)}
    </nav>
  )
}

function Chips({
  label,
  options,
  value,
  param,
  current,
}: {
  label: string
  options: [string, string][]
  value: string
  param: keyof Search
  current: Search
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-1.5 max-sm:-mx-4 max-sm:[scrollbar-width:none] max-sm:overflow-x-auto max-sm:px-4 sm:flex-wrap [&>a]:shrink-0"
    >
      {options.map(([v, text]) => (
        <Link
          key={v}
          href={href(current, { [param]: v })}
          scroll={false}
          aria-current={value === v ? 'true' : undefined}
          className={cx(
            'inline-flex h-8 items-center rounded-full border px-3 text-small font-medium transition-colors',
            value === v
              ? 'border-primary-tint-border bg-primary-tint text-primary'
              : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
          )}
        >
          {text}
        </Link>
      ))}
    </div>
  )
}

async function JobsWorkspace({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  await refreshIfStale()
  const abroad = sp.scope === 'abroad'
  const filter: JobFilter = {
    scope: abroad ? 'abroad' : 'home',
    level: (sp.level as Level) ?? 'all',
    region: abroad ? 'all' : ((sp.region as Region) ?? 'all'),
    country: abroad ? (sp.country ?? 'all') : 'all',
    category: sp.category ?? 'all',
    sort: sp.sort === 'newest' ? 'newest' : 'best',
  }
  const selectedId = Number(sp.job)
  const [{ rows, total }, status, counts] = await Promise.all([getJobs(filter), getSearchStatus(), getScopeCounts()])
  // The panel shows the chosen job; on wide screens it falls back to the first one in the list.
  const panelId = Number.isInteger(selectedId) && selectedId > 0 ? selectedId : rows[0]?.id
  const detail = panelId ? await getJob(panelId) : null
  const chosen = Boolean(sp.job) && detail !== null
  const active = [filter.level, filter.region, filter.country, filter.category].filter((v) => v && v !== 'all').length
  const countryOptions: [string, string][] = [
    ['all', `All countries (${counts.abroad})`],
    ...counts.byCountry.map(({ country, n }): [string, string] => [
      country,
      `${COUNTRY_FLAGS[country as CountryCode] ?? '🌍'} ${COUNTRY_NAMES[country as CountryCode] ?? 'Other'} (${n})`,
    ]),
  ]

  return (
    <>
      <JobKeys />
      <ScopeTabs abroad={abroad} home={counts.home} away={counts.abroad} />
      {abroad && <CountryGuide country={filter.country ?? 'all'} />}
      <div className="grid gap-2.5">
        {abroad ? (
          <Chips
            label="Country"
            options={countryOptions}
            value={filter.country ?? 'all'}
            param="country"
            current={sp}
          />
        ) : (
          <Chips label="Where" options={REGIONS} value={filter.region ?? 'all'} param="region" current={sp} />
        )}
        <Chips label="Level" options={LEVELS} value={filter.level ?? 'all'} param="level" current={sp} />
        <Chips
          label="Kind of role"
          options={CATEGORIES.map((c) => [c, c === 'all' ? 'All roles' : c])}
          value={filter.category ?? 'all'}
          param="category"
          current={sp}
        />
      </div>

      <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 text-small text-ink-2">
        <span>
          <b className="font-semibold text-ink tabular-nums">{total}</b> open role{total === 1 ? '' : 's'}
          {active > 0 && (
            <>
              {' '}
              ·{' '}
              <Link
                href={abroad ? '/jobs?scope=abroad' : '/jobs'}
                scroll={false}
                className="font-medium text-primary hover:underline"
              >
                Clear filters
              </Link>
            </>
          )}
          {status.lastRunAt && <> · last search {timeAgo(status.lastRunAt)}</>}
          {status.running && <> · searching now</>}
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden text-ink-3 lg:inline">J / K to move</span>
          <Link
            href={href(sp, { sort: 'best' })}
            scroll={false}
            aria-current={filter.sort === 'best' ? 'true' : undefined}
            className={cx('font-medium', filter.sort === 'best' ? 'text-primary' : 'hover:text-ink')}
          >
            Best match
          </Link>
          <Link
            href={href(sp, { sort: 'newest' })}
            scroll={false}
            aria-current={filter.sort === 'newest' ? 'true' : undefined}
            className={cx('font-medium', filter.sort === 'newest' ? 'text-primary' : 'hover:text-ink')}
          >
            Newest
          </Link>
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-12">
        {detail && (
          <div className={cx('lg:sticky lg:top-[88px] lg:order-2 lg:col-span-5', !chosen && 'hidden lg:block')}>
            {chosen ? (
              <RevealOnPhone id={detail.id}>
                <JobInspector job={detail} closeHref={href(sp, { job: undefined })} />
              </RevealOnPhone>
            ) : (
              <JobInspector job={detail} />
            )}
          </div>
        )}
        <Card className="lg:order-1 lg:col-span-7">
          {rows.length ? (
            <ul>
              {rows.map((job) => (
                <JobRowItem
                  key={job.id}
                  job={job}
                  href={href(sp, { job: String(job.id) })}
                  selected={job.id === detail?.id}
                />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-12 text-center text-ink-2">
              {status.lastRunAt ? 'Nothing matches these filters right now.' : 'No search has run yet. Run one above.'}
            </p>
          )}
        </Card>
      </div>
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
      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-[520px] rounded-card lg:col-span-7" />
        <Skeleton className="hidden h-[520px] rounded-card lg:col-span-5 lg:block" />
      </div>
    </div>
  )
}
