import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { StatusSelect } from '@/components/jobs/status-select'
import { buttonClass } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ApplicationsIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getApplications } from '@/lib/data'
import { timeAgo } from '@/lib/format'
import { removeApplication, setApplicationStatus } from '../actions'

export const metadata: Metadata = { title: 'Applications' }

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader title="Applications" text="Everything you applied to, newest first." />
      <Suspense fallback={<Skeleton className="h-80 rounded-card" />}>
        <ApplicationsList />
      </Suspense>
    </>
  )
}

async function ApplicationsList() {
  const rows = await getApplications()
  if (!rows.length) {
    return (
      <EmptyState
        icon={<ApplicationsIcon />}
        title="Nothing tracked yet"
        text="When you apply from Jobs and answer Yes to “Did you apply?”, it shows up here."
        action={
          <Link href="/jobs" className={buttonClass()}>
            Go to Jobs
          </Link>
        }
      />
    )
  }
  return (
    <Card>
      <ul>
        {rows.map((a) => (
          <li
            key={a.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 sm:px-[22px]"
          >
            <span className="min-w-0">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-medium hover:text-primary"
              >
                {a.title}
              </a>
              <small className="block truncate text-[13.5px] text-ink-3">
                {a.company} · {a.location} · applied {timeAgo(a.appliedAt)}
                {a.closed && ' · posting closed'}
              </small>
            </span>
            <StatusSelect
              id={a.id}
              status={a.status}
              label={`${a.title} at ${a.company}`}
              onChange={setApplicationStatus}
              onRemove={removeApplication}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}
