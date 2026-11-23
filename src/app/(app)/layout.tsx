import { Suspense } from 'react'
import { signOut } from '@/app/login/actions'
import { AppHeader } from '@/components/shell/app-header'
import { HeaderShell } from '@/components/shell/header-shell'
import { MenuStateProvider } from '@/components/shell/menu-state'
import type { ShellActions, ShellData } from '@/components/shell/types'
import { getCounts, getSearchStatus } from '@/lib/data'
import { timeAgo } from '@/lib/format'
import { getUser } from '@/lib/auth/session'
import { displayUser } from '@/lib/owner'
import { runSearchNow } from './actions'

const actions: ShellActions = { runSearchNow, signOut }
const loading: ShellData = { counts: null, search: null }
const nobody = displayUser(null)

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <MenuStateProvider>
        <Suspense fallback={<HeaderShell />}>
          <Suspense fallback={<AppHeader user={nobody} data={loading} actions={actions} />}>
            <HeaderWithData />
          </Suspense>
        </Suspense>
      </MenuStateProvider>
      <main className="mx-auto max-w-[1160px] px-4 pt-7 pb-16 has-[.editor-wide]:max-w-none has-[.editor-wide]:pt-4 sm:px-5 sm:pt-9">
        {children}
      </main>
    </>
  )
}

async function HeaderWithData() {
  const [counts, status, user] = await Promise.all([getCounts(), getSearchStatus(), getUser()])
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
  return <AppHeader user={displayUser(user)} data={data} actions={actions} />
}
