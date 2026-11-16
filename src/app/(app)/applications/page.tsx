import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { ApplicationsIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Applications' }

export default function Page() {
  return (
    <>
      <PageHeader title="Applications" text="Everything you applied to, by stage." />
      <EmptyState
        icon={<ApplicationsIcon />}
        title="Nothing tracked yet"
        text="When you apply from Jobs and confirm, the application shows up here."
      />
    </>
  )
}
