import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LocationIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Roles and locations' }

export default function Page() {
  return (
    <>
      <PageHeader title="Roles and locations" text="What counts as a match for you." />
      <EmptyState
        icon={<LocationIcon />}
        title="Set up with the job search"
        text="Roles, levels, graduation year and locations arrive in Phase 7."
      />
    </>
  )
}
