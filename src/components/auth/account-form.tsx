'use client'

import { useActionState, useState } from 'react'
import { GoogleButton } from '@/app/login/login-form'
import type { FormState } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>
  /** Fixed email (from the invite); when absent the form asks for one. */
  email?: string
  hidden?: Record<string, string>
  google?: boolean
  submit: string
  passwordMin: number
}

export function AccountForm({ action, email, hidden, google, submit, passwordMin }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {})
  const [googleError, setGoogleError] = useState<string>()
  return (
    <div className="mt-6 grid gap-4">
      {google && email && (
        <>
          <GoogleButton onError={setGoogleError} label={`Continue with Google (${email})`} />
          {googleError && <p className="text-small text-danger">{googleError}</p>}
          <div className="flex items-center gap-3 text-small text-ink-3">
            <span className="h-px flex-1 bg-line" />
            or set a password
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form action={formAction} className="grid gap-4">
        {Object.entries(hidden ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <Input label="Your name" name="name" autoComplete="name" autoFocus required maxLength={80} />
        {email ? (
          <Input label="Email" value={email} readOnly disabled hint="From your invite." />
        ) : (
          <Input label="Email" name="email" type="email" autoComplete="email" required />
        )}
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          minLength={passwordMin}
          maxLength={128}
          hint={`At least ${passwordMin} characters.`}
        />
        <PasswordInput label="Password again" name="confirm" autoComplete="new-password" required />
        {state.error && (
          <p role="alert" className="text-small text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" loading={pending} className="w-full">
          {submit}
        </Button>
      </form>
    </div>
  )
}
