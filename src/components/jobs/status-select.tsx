'use client'

import { useTransition } from 'react'
import type { ApplicationStatus } from '@/db/schema'
import { Button } from '@/components/ui/button'

const OPTIONS: [ApplicationStatus, string][] = [
  ['applied', 'Applied'],
  ['oa', 'Online test'],
  ['interview', 'Interview'],
  ['offer', 'Offer'],
  ['rejected', 'Rejected'],
  ['saved', 'Saved'],
]

export function StatusSelect({
  id,
  status,
  label,
  onChange,
  onRemove,
}: {
  id: number
  status: ApplicationStatus
  label: string
  onChange: (id: number, status: ApplicationStatus) => Promise<void>
  onRemove: (id: number) => Promise<void>
}) {
  const [pending, start] = useTransition()
  return (
    <span className="flex items-center gap-1.5">
      <select
        aria-label={`Stage for ${label}`}
        value={status}
        disabled={pending}
        onChange={(e) => start(() => onChange(id, e.target.value as ApplicationStatus))}
        className="h-8 rounded-control border border-line-strong bg-surface px-2 text-small font-medium text-ink"
      >
        {OPTIONS.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Remove ${label}`}
        disabled={pending}
        onClick={() => start(() => onRemove(id))}
      >
        Remove
      </Button>
    </span>
  )
}
