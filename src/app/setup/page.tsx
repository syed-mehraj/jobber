import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { AccountForm } from '@/components/auth/account-form'
import { AuthCard } from '@/components/auth/auth-card'
import { PASSWORD_MIN } from '@/lib/auth/auth'
import { hasAdmin, setupOwner } from '../login/actions'

export const metadata: Metadata = { title: 'Set up Jobber' }

export default function SetupPage() {
  return (
    <AuthCard
      title="Set up Jobber"
      subtitle="Create the owner account. Everything saved so far (resumes, About you, applications) moves into it."
    >
      <Suspense fallback={<p className="mt-6 text-ink-3">Loading…</p>}>
        <SetupBody />
      </Suspense>
    </AuthCard>
  )
}

async function SetupBody() {
  await connection()
  if (await hasAdmin()) {
    return (
      <p className="mt-6 text-ink-2">
        Jobber is already set up.{' '}
        <Link href="/login" className="font-semibold text-primary underline-offset-2 hover:underline">
          Sign in
        </Link>
        .
      </p>
    )
  }
  return <AccountForm action={setupOwner} ownerPassword submit="Create owner account" passwordMin={PASSWORD_MIN} />
}
