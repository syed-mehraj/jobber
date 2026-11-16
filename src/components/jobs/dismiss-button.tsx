'use client'

import { useTransition } from 'react'
import { setDismissed } from '@/app/(app)/actions'
import { Button } from '@/components/ui/button'

export function DismissButton({ jobId, dismissed }: { jobId: number; dismissed: boolean }) {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="ghost"
      loading={pending}
      onClick={() => start(() => setDismissed(jobId, !dismissed))}
      title={dismissed ? 'Show this role in the lists again' : 'Hide this role from the lists'}
    >
      {dismissed ? 'Restore' : 'Not for me'}
    </Button>
  )
}
