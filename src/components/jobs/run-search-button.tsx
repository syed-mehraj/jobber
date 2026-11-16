'use client'

import { useState, useTransition } from 'react'
import { Button, type ButtonVariant } from '@/components/ui/button'

/** Runs a search now and reports what it found. The server action refreshes the page when done. */
export function RunSearchButton({
  run,
  variant = 'secondary',
}: {
  run: () => Promise<{ ok: boolean; message: string }>
  variant?: ButtonVariant
}) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <Button
        variant={variant}
        loading={pending}
        onClick={() =>
          start(async () => {
            setMessage(null)
            setMessage((await run()).message)
          })
        }
      >
        {pending ? 'Searching…' : 'Run search now'}
      </Button>
      <span className="text-small text-ink-2" aria-live="polite">
        {pending ? 'Checking every source. This takes about a minute.' : message}
      </span>
    </span>
  )
}
