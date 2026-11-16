import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ApplyButton } from '@/components/dashboard/apply-button'
import { GreetingFallback, GreetingHeading } from '@/components/dashboard/greeting-heading'
import { Card, CardHeader } from '@/components/ui/card'
import { cx } from '@/lib/cx'
import { sampleCounts, sampleMatches, sampleUser } from '@/lib/sample-data'
import { bandText, scoreBand } from '@/lib/score'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  const counts = sampleCounts
  const stats = [
    { href: '/jobs', value: counts.newMatches, label: 'New matches', short: 'New', accent: true },
    { href: '/applications', value: counts.applied, label: 'Applied' },
    { href: '/applications?stage=interview', value: counts.interviews, label: 'Interviews' },
  ]

  return (
    <>
      <Suspense fallback={<GreetingFallback name={sampleUser.firstName} />}>
        <GreetingHeading name={sampleUser.firstName} />
      </Suspense>
      <p className="mt-1.5 text-large text-ink-2">
        <b className="font-semibold text-primary">{counts.newToday} new jobs</b> match your resumes today.
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
            <Link href="/jobs" className="text-[14px] font-medium text-primary hover:underline">
              See all {counts.newMatches} →
            </Link>
          }
        />
        <ul>
          {sampleMatches.map((m) => (
            <li
              key={m.id}
              className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface-muted sm:grid-cols-[40px_minmax(0,1fr)_auto_auto] sm:px-[22px] sm:py-3.5"
            >
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-[10px] bg-sunken font-semibold text-ink-2 sm:size-10"
              >
                {m.company[0]}
              </span>
              <span className="min-w-0">
                <Link href="/jobs" className="block truncate font-medium hover:text-primary">
                  {m.role}
                </Link>
                <small className="block text-[13.5px] text-ink-3">
                  {m.company} · {m.location}
                </small>
              </span>
              <span className="flex flex-col items-end text-caption text-ink-3">
                <strong className={cx('text-large font-semibold', bandText[scoreBand(m.score)])}>{m.score}%</strong>
                match
              </span>
              <span className="col-start-2 col-end-[-1] sm:col-auto">
                <ApplyButton url={m.applyUrl} label={`${m.role} at ${m.company}`} />
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-5 text-[12.5px] text-ink-3">
        Sample data until the daily search runs. Company names show the target list only; these are not real postings.
      </p>
    </>
  )
}
