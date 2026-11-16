import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { ResumeIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'New resume' }

export default function Page() {
  return (
    <>
      <PageHeader title="New resume" text="Start from your master resume or a blank page." />
      <EmptyState
        icon={<ResumeIcon />}
        title="The editor is next"
        text="Edit on the left, see the page on the right, and edit the page directly. It arrives in Phase 3."
      />
    </>
  )
}
