'use client'

import { useState, useTransition } from 'react'
import { markApplied } from '@/app/(app)/actions'
import { Button, buttonClass } from '@/components/ui/button'
import { CheckIcon, ExternalIcon } from '@/components/ui/icons'

type Step = 'idle' | 'asking' | 'applied'

/**
 * Apply opens the company's own page in a new tab, then asks "Did you apply?".
 * Yes records it in Applications; Not yet goes back to the Apply button.
 */
export function ApplyButton({
  jobId,
  url,
  label,
  applied = false,
  onApplied = markApplied,
}: {
  jobId: number
  url: string
  label: string
  applied?: boolean
  onApplied?: (jobId: number) => Promise<void>
}) {
  const [step, setStep] = useState<Step>(applied ? 'applied' : 'idle')
  const [pending, start] = useTransition()

  if (step === 'applied') {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 text-small font-medium text-success [&_svg]:size-4">
        <CheckIcon />
        Applied
      </span>
    )
  }

  if (step === 'asking') {
    return (
      <span role="group" aria-label={`Did you apply to ${label}?`} className="inline-flex items-center gap-2">
        <span className="text-small text-ink-2">Did you apply?</span>
        <Button
          size="sm"
          variant="subtle"
          loading={pending}
          onClick={() =>
            start(async () => {
              await onApplied(jobId)
              setStep('applied')
            })
          }
        >
          Yes
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setStep('idle')}>
          Not yet
        </Button>
      </span>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Apply to ${label} (opens in a new tab)`}
      onClick={() => setStep('asking')}
      className={buttonClass({ size: 'sm' })}
    >
      Apply
      <ExternalIcon />
    </a>
  )
}
