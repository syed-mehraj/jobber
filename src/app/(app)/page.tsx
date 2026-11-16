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
    { href: '/jobs', value: counts.newMatches, label: 'New matches', short: 'New', accent: true },
    { href: '/applications', value: counts.applied, label: 'Applied' },
    { href: '/applications', value: counts.interviews, label: 'Interviews' },
  ]

  return (
    <>
      <p className="mt-1.5 text-large text-ink-2">
        {neverRun || status.running ? (
          status.running ? (
            'Searching company career sites now. Refresh in a minute.'
          ) : (
            'Your first job search starts now. Refresh in a minute.'
          )
        ) : counts.newToday > 0 ? (
          <>
            <b className="font-semibold text-primary">
              {counts.newToday} new job{counts.newToday === 1 ? '' : 's'}
            </b>{' '}
            match your profile today.
          </>
        ) : (
          'No new matches yet today. The best open ones are below.'
        )}
      </p>

      <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="block rounded-card border border-line bg-surface p-3.5 shadow-card transition-colors hover:border-primary-soft sm:px-[22px] sm:py-5"
          >
            <b
              className={cx(
                'block text-[26px] leading-8 font-semibold tracking-[-0.02em] sm:text-stat',
                s.accent && 'text-primary',
              )}
            >
              {s.value}
            </b>
            <span className="text-small whitespace-nowrap text-ink-2 sm:text-body">
              {s.short ? (
                <>
                  <span className="min-[421px]:hidden">{s.short}</span>
                  <span className="max-[420px]:hidden">{s.label}</span>
                </>
              ) : (
                s.label
              )}
            </span>
          </Link>
        ))}
      </div>

      <Card className="mt-7" aria-labelledby="best-matches">
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
              <JobRowItem key={job.id} job={job} isNew={job.isNew} />
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
        Match is keyword-based for now: level, location, and the skills from your work that a posting mentions. Gemini
        scoring replaces it once the key is added.
      </p>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mt-3 h-5 w-72" />
      <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-[86px] rounded-card sm:h-[106px]" />
        <Skeleton className="h-[86px] rounded-card sm:h-[106px]" />
        <Skeleton className="h-[86px] rounded-card sm:h-[106px]" />
      </div>
      <Skeleton className="mt-7 h-[420px] rounded-card" />
    </div>
  )
}
