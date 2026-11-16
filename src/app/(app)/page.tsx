import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { GreetingFallback, GreetingHeading } from '@/components/dashboard/greeting-heading'
import { RunSearchButton } from '@/components/jobs/run-search-button'
import { JobRowItem } from '@/components/jobs/job-row'
import { Card, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cx } from '@/lib/cx'
import { getCounts, getSearchStatus, getTopMatches, refreshIfStale } from '@/lib/data'
import { owner } from '@/lib/owner'
import { timeAgo } from '@/lib/format'
import { runSearchNow } from './actions'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<GreetingFallback name={owner.firstName} />}>
        <GreetingHeading name={owner.firstName} />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody />
      </Suspense>
    </>
  )
}

async function DashboardBody() {
  await refreshIfStale()
  const [counts, top, status] = await Promise.all([getCounts(), getTopMatches(5), getSearchStatus()])
  const neverRun = !status.lastRunAt && !status.running

  const stats = [
    {
      href: '/jobs',
      value: counts.newMatches,
      label: 'Open matches',
      context: counts.newToday > 0 ? `+${counts.newToday} new today` : 'None new today',
      good: counts.newToday > 0,
    },
    {
      href: '/applications',
      value: counts.applied,
      label: 'Applied',
      context: counts.applied ? `${counts.waiting} waiting to hear back` : 'Apply from a match',
    },
    {
      href: '/applications',
      value: counts.interviews,
      label: 'Tests and interviews',
      context: counts.offers
        ? `${counts.offers} offer${counts.offers === 1 ? '' : 's'}`
        : 'Set the stage in Applications',
    },
  ]

  return (
    <>
      <p className="mt-1.5 text-large text-ink-2">
        {status.running
          ? 'Searching company career sites now. Refresh in a minute.'
          : neverRun
            ? 'Your first job search starts now. Refresh in a minute.'
            : `Checked ${status.sourcesTotal} sources ${timeAgo(status.lastRunAt)}. Here is what's worth applying to.`}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="block rounded-card border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong sm:px-5 sm:py-4"
          >
            <span className="flex items-baseline justify-between gap-3 min-[560px]:block">
              <span className="block text-small font-medium text-ink-2">{s.label}</span>
              <b className="block text-[28px] leading-8 font-semibold tracking-[-0.02em] tabular-nums min-[560px]:mt-1">
                {s.value}
              </b>
            </span>
            <span className={cx('mt-0.5 block text-small', s.good ? 'font-medium text-success' : 'text-ink-3')}>
              {s.context}
            </span>
          </Link>
        ))}
      </div>

      <Card className="mt-6" aria-labelledby="best-matches">
        <CardHeader
          id="best-matches"
          title="Today's best matches"
          action={
            counts.newMatches > 0 && (
              <Link href="/jobs" className="text-[14px] font-medium text-primary hover:underline">
                See all {counts.newMatches} →
              </Link>
            )
          }
        />
        {top.length ? (
          <ul>
            {top.map((job) => (
              <JobRowItem key={job.id} job={job} href={`/jobs?job=${job.id}`} />
            ))}
          </ul>
        ) : (
          <div className="grid justify-items-center gap-3 px-6 py-12 text-center">
            <p className="text-ink-2">Matches will appear here after the first search.</p>
            <RunSearchButton run={runSearchNow} />
          </div>
        )}
      </Card>

      <p className="mt-5 text-[12.5px] text-ink-3">
        Match % weighs the level, the location, the skills from your work that the posting mentions, and how fresh it
        is. Open a role to see why it matched. Gemini scoring replaces it once the key is added.
      </p>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mt-3 h-5 w-72" />
      <div className="mt-6 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3">
        <Skeleton className="h-[74px] rounded-card min-[560px]:h-[104px]" />
        <Skeleton className="h-[74px] rounded-card min-[560px]:h-[104px]" />
        <Skeleton className="h-[74px] rounded-card min-[560px]:h-[104px]" />
      </div>
      <Skeleton className="mt-6 h-[420px] rounded-card" />
    </div>
  )
}
