'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'

export function LoginForm({ google, error: initialError }: { google: boolean; error?: string }) {
  const [error, setError] = useState(initialError)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(undefined)
    const { error } = await authClient.signIn.email({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
    })
    if (error) {
      setPending(false)
      setError(
        error.status === 429
          ? 'Too many tries. Wait a few minutes and try again.'
          : 'That email or password is not right.',
      )
      return
    }
    // A full load: the router may have cached "/" as a redirect to /login from before signing in.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full load, see above
    window.location.assign('/')
  }

  return (
    <div className="mt-6 grid gap-4">
      {google && (
        <>
          <GoogleButton onError={setError} />
          <div className="flex items-center gap-3 text-small text-ink-3">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form onSubmit={onSubmit} className="grid gap-4">
        <Input label="Email" name="email" type="email" autoComplete="email" autoFocus required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={error}
        />
        <Button type="submit" variant="primary" size="lg" loading={pending} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  )
}

/** "Continue with Google". New accounts are created only for invited emails (checked on the server). */
export function GoogleButton({
  onError,
  label = 'Continue with Google',
}: {
  onError: (e: string) => void
  label?: string
}) {
  const [pending, setPending] = useState(false)
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      loading={pending}
      className="w-full"
      onClick={async () => {
        setPending(true)
        const { error } = await authClient.signIn.social({
          provider: 'google',
          callbackURL: '/',
          errorCallbackURL: '/login',
        })
        if (error) {
          setPending(false)
          onError(error.status === 429 ? 'Too many tries. Wait a minute.' : 'Google sign-in did not start. Try again.')
        }
      }}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
        <path
          fill="#4285F4"
          d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z"
        />
        <path
          fill="#EA4335"
          d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z"
        />
      </svg>
      {label}
    </Button>
  )
}
