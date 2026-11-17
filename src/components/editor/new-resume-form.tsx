'use client'

import { useActionState, useState } from 'react'
import type { CreateState } from '@/app/(app)/resumes/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cx } from '@/lib/cx'

type Source = { id: number; name: string; isMaster: boolean }

export function NewResumeForm({
  sources,
  action,
}: {
  sources: Source[]
  action: (prev: CreateState, form: FormData) => Promise<CreateState>
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const master = sources.find((s) => s.isMaster)
  const [from, setFrom] = useState(master ? 'master' : 'blank')
  const others = sources.filter((s) => !s.isMaster)

  const options = [
    ...(master
      ? [
          {
            value: 'master',
            title: 'Copy of your master resume',
            text: 'Everything you have done; then cut and tailor it.',
          },
        ]
      : []),
    ...others.map((o) => ({
      value: String(o.id),
      title: `Copy of “${o.name}”`,
      text: 'Start from a version you already tailored.',
    })),
    { value: 'blank', title: 'Blank', text: 'Only your contact details and education.' },
  ]

  return (
    <form action={formAction} className="grid gap-5">
      <Input label="Name" name="name" placeholder="e.g. Backend SDE – Razorpay" required maxLength={120} autoFocus />
      <Input label="For (optional)" name="target" placeholder="Company or role it is for" maxLength={120} />
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-small font-medium text-ink-2">Start from</legend>
        {options.map((o) => (
          <label
            key={o.value}
            className={cx(
              'flex cursor-pointer gap-3 rounded-control border px-3.5 py-3 transition-colors',
              from === o.value ? 'border-primary bg-primary-tint/50' : 'border-line hover:border-line-strong',
            )}
          >
            <input
              type="radio"
              name="from"
              value={o.value}
              checked={from === o.value}
              onChange={() => setFrom(o.value)}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block font-medium">{o.title}</span>
              <span className="block text-small text-ink-2">{o.text}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.error && (
        <p className="text-small text-danger" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" loading={pending}>
          Create and open the editor
        </Button>
      </div>
    </form>
  )
}
