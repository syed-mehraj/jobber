import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { Brand } from '@/components/shell/brand'
import { Card } from '@/components/ui/card'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Card className="w-full max-w-[400px] p-7 shadow-pop">
        <Brand />
        <h1 className="mt-6 text-[22px] leading-8 font-semibold tracking-[-0.01em]">Sign in</h1>
        <p className="mt-1 text-ink-2">This workspace is private.</p>
        <Suspense fallback={<LoginForm ready />}>
          <LoginBody />
        </Suspense>
      </Card>
    </main>
  )
}

/** Reads the environment per request, so setting a password doesn't need a rebuild. */
async function LoginBody() {
  await connection()
  const ready = Boolean(process.env.APP_PASSWORD_HASH && process.env.SESSION_SECRET)
  return (
    <>
      {!ready && (
        <p className="mt-4 rounded-control border border-warning/30 bg-warning-tint px-3 py-2.5 text-small text-warning">
          No password is set yet. In the jobber folder run <code className="font-semibold">npm run set-password</code>,
          then restart the app.
        </p>
      )}
      <LoginForm ready={ready} />
    </>
  )
}
