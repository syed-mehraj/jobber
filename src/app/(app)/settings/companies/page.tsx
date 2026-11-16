import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { CompaniesIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Companies and sources' }

export default function Page() {
  return (
    <>
      <PageHeader title="Companies and sources" text="Which companies the daily search checks, and where." />
      <EmptyState
        icon={<CompaniesIcon />}
        title="Set up with the job search"
        text="The company list and each source's health arrive in Phase 7."
      />
    </>
  )
}
