import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ConfirmButton } from '@/components/admin/confirm-button'
import { InviteForm } from '@/components/admin/invite-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getPeople, getPendingInvites } from '@/lib/admin'
import { requireAdmin } from '@/lib/auth/session'
import { timeAgo } from '@/lib/format'
import { inviteSomeone, removePerson, revokeInvite } from './actions'

export const metadata: Metadata = { title: 'People and invites' }

const METHOD: Record<string, string> = { credential: 'Password', google: 'Google' }

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="People and invites"
        text="Jobber is invite-only. Each person has their own resumes, About you, applications and match scores."
      />
      <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
        <AdminBody />
      </Suspense>
    </>
  )
}

/** Everything here is admin-only: requireAdmin sends anyone else to the dashboard. */
async function AdminBody() {
  const me = await requireAdmin()
  const [people, pending] = await Promise.all([getPeople(), getPendingInvites()])
  return (
    <div className="grid gap-6">
      <Card className="p-5 sm:p-[22px]">
        <h2 className="text-section mb-4 font-semibold">Invite someone</h2>
        <InviteForm action={inviteSomeone} />
      </Card>
      <Card>
        <CardHeader title={`People (${people.length})`} />
        <ul>
          {people.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 sm:px-[22px]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.name} {p.id === me.id && <span className="text-ink-3">(you)</span>}
                </p>
                <p className="truncate text-small text-ink-2">{p.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {p.role === 'admin' && <Badge tone="primary">Admin</Badge>}
                {p.methods.map((m) => (
                  <Badge key={m}>{METHOD[m] ?? m}</Badge>
                ))}
              </div>
              <span className="w-24 text-small text-ink-3">Joined {timeAgo(p.createdAt)}</span>
              {p.role !== 'admin' && (
                <ConfirmButton
                  label="Remove"
                  question={`Remove ${p.name} (${p.email})? Their resumes, About you and applications are deleted too.`}
                  run={removePerson.bind(null, p.id)}
                />
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title={`Open invites (${pending.length})`} />
        {pending.length === 0 ? (
          <p className="border-t border-line px-5 py-4 text-small text-ink-3 sm:px-[22px]">No open invites.</p>
        ) : (
          <ul>
            {pending.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-3 sm:px-[22px]">
                <span className="min-w-0 flex-1 truncate">{i.email}</span>
                <span className="text-small text-ink-3">
                  Sent {timeAgo(i.createdAt)} · expires{' '}
                  {i.expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <ConfirmButton
                  label="Revoke"
                  question={`Revoke the invite for ${i.email}?`}
                  run={revokeInvite.bind(null, i.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
