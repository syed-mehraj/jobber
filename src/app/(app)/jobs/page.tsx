import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { JobsIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Jobs' }

export default function Page() {
  return (
    <>
      <PageHeader title="Jobs" text="Matches from the daily search, best first." />
      <EmptyState
        icon={<JobsIcon />}
        title="No matches yet"
        text="Jobs appear here after the first daily search of company career sites."
      />
    </>
  )
}
