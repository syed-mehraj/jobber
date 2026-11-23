import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/auth-card'
import { googleEnabled } from '@/lib/auth/auth'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

const ERRORS: Record<string, string> = {
  google: 'Google sign-in did not work. Try again.',
  unable_to_create_user: 'That Google account has no invite. Ask the owner to invite this email.',
  access_denied: 'Google sign-in was cancelled.',
}

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <AuthCard title="Sign in" subtitle="Jobber is invite-only.">
      <Suspense fallback={<LoginForm google={false} />}>
        <LoginBody searchParams={props.searchParams} />
      </Suspense>
    </AuthCard>
  )
}

async function LoginBody({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  await connection()
  const params = await searchParams
  const code = typeof params.error === 'string' ? params.error.toLowerCase() : ''
  const error = code ? (ERRORS[code] ?? ERRORS.google) : undefined
  return <LoginForm google={googleEnabled()} error={error} />
}
