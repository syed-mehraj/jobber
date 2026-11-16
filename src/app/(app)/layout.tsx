import { Suspense } from 'react'
import { signOut } from '@/app/login/actions'
import { AppHeader } from '@/components/shell/app-header'
import { MenuStateProvider } from '@/components/shell/menu-state'
import type { ShellActions, ShellData } from '@/components/shell/types'
import { getCounts, getSearchStatus } from '@/lib/data'
import { timeAgo } from '@/lib/format'
import { owner } from '@/lib/owner'
import { runSearchNow } from './actions'

const actions: ShellActions = { runSearchNow, signOut }
const loading: ShellData = { counts: null, search: null }

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <MenuStateProvider>
        <Suspense fallback={<AppHeader user={owner} data={loading} actions={actions} />}>
          <HeaderWithData />
        </Suspense>
      </MenuStateProvider>
      <main className="mx-auto max-w-[1040px] px-4 pt-7 pb-16 sm:px-5 sm:pt-9">{children}</main>
    </>
  )
}

async function HeaderWithData() {
  const [counts, status] = await Promise.all([getCounts(), getSearchStatus()])
  const data: ShellData = {
    counts,
    search: {
      running: status.running,
      healthy: status.sourcesTotal > 0 && status.sourcesWorking >= status.sourcesTotal * 0.8,
      label: status.running ? 'Searching now…' : `Checks every ${status.refreshMinutes} min while you use it`,
      detail: status.lastRunAt
        ? `Last run ${timeAgo(status.lastRunAt)} · ${status.sourcesWorking} of ${status.sourcesTotal} sources working`
        : 'No search has run yet.',
    },
  }
  return <AppHeader user={owner} data={data} actions={actions} />
}
