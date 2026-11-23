import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { AccountForm } from '@/components/auth/account-form'
import { AuthCard } from '@/components/auth/auth-card'
import { getDb } from '@/db'
import { googleEnabled, PASSWORD_MIN } from '@/lib/auth/auth'
import { findInviteByToken } from '@/lib/auth/invites'
import { signUpWithInvite } from '../login/actions'

export const metadata: Metadata = { title: 'Create your account' }

export default function SignupPage(props: PageProps<'/signup'>) {
  return (
    <AuthCard title="Create your account" subtitle="You were invited to Jobber.">
      <Suspense fallback={<p className="mt-6 text-ink-3">Checking your invite…</p>}>
        <SignupBody searchParams={props.searchParams} />
      </Suspense>
    </AuthCard>
  )
}

async function SignupBody({ searchParams }: { searchParams: PageProps<'/signup'>['searchParams'] }) {
  await connection()
  const params = await searchParams
  const token = typeof params.invite === 'string' ? params.invite : ''
  const invite = token ? await findInviteByToken(await getDb(), token) : null
  if (!invite) {
    return (
      <p className="mt-6 rounded-control border border-warning/30 bg-warning-tint px-3 py-2.5 text-small text-warning">
        This invite link has expired or was already used. Ask for a new one, or{' '}
        <Link href="/login" className="font-semibold underline">
          sign in
        </Link>
        .
      </p>
    )
  }
  return (
    <AccountForm
      action={signUpWithInvite}
      email={invite.email}
      hidden={{ invite: token }}
      google={googleEnabled()}
      submit="Create account"
      passwordMin={PASSWORD_MIN}
    />
  )
}
