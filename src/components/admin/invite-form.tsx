'use client'

import { useActionState, useState } from 'react'
import type { InviteResult } from '@/app/(app)/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function InviteForm({
  action,
}: {
  action: (prev: InviteResult | null, form: FormData) => Promise<InviteResult>
}) {
  const [state, formAction, pending] = useActionState<InviteResult | null, FormData>(action, null)
  const [copied, setCopied] = useState(false)
  return (
    <div className="grid gap-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3" onSubmit={() => setCopied(false)}>
        <Input
          label="Their email"
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="friend@gmail.com"
          className="min-w-[240px] flex-1"
          error={state && !state.ok ? state.error : undefined}
        />
        <Button type="submit" variant="primary" loading={pending}>
          Create invite link
        </Button>
      </form>
      {state?.ok && (
        <div className="grid gap-2 rounded-control border border-success/30 bg-success-tint p-3">
          <p className="text-small text-ink-2">
            Send this link to <strong className="text-ink">{state.email}</strong>. It works once, for 14 days, and is
            shown only now. They can then sign in with Google (same email) or set a password.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code
              className="min-w-0 flex-1 truncate rounded-control bg-surface px-2 py-1.5 text-small"
              title={state.link}
            >
              {state.link}
            </code>
            <Button
              size="sm"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(state.link)
                setCopied(true)
              }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
