'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn, type LoginState } from './actions'

export function LoginForm({ ready }: { ready: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {})
  return (
    <form action={action} className="mt-6 grid gap-4">
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        disabled={!ready}
        error={state.error}
      />
      <Button type="submit" variant="primary" size="lg" loading={pending} disabled={!ready} className="w-full">
        Sign in
      </Button>
    </form>
  )
}
