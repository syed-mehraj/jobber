'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

/** A small button that asks first, then runs a server action. */
export function ConfirmButton({ label, question, run }: { label: string; question: string; run: () => Promise<void> }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      loading={pending}
      onClick={() => {
        if (window.confirm(question)) start(run)
      }}
    >
      {label}
    </Button>
  )
}
