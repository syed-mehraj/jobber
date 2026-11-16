import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { BellIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Telegram alerts' }

export default function Page() {
  return (
    <>
      <PageHeader title="Telegram alerts" text="The morning digest of new matches." />
      <EmptyState
        icon={<BellIcon />}
        title="Set up with the daily run"
        text="Connect the Telegram bot and send a test message in Phase 8."
      />
    </>
  )
}
