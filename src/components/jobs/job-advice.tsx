'use client'

import { useState, useTransition } from 'react'
import { adviseForJob, createTailoredResume } from '@/app/(app)/jobs/advice-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Fit, JobAdvice } from '@/jobs/advice'

const FIT_LABEL: Record<Fit, { text: string; tone: 'success' | 'primary' | 'warning' }> = {
  strong: { text: 'Strong fit', tone: 'success' },
  good: { text: 'Good fit', tone: 'primary' },
  stretch: { text: 'A stretch', tone: 'warning' },
}

/**
 * "Resume advice" for the open job: what to lead with, what's missing, and reworded lines to tick. Creating the
 * tailored copy is a separate click, so nothing is saved until then.
 */
export function JobAdvice({ jobId, label }: { jobId: number; label: string }) {
  const [advice, setAdvice] = useState<JobAdvice | null>(null)
  const [error, setError] = useState<string>()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [asking, startAsk] = useTransition()
  const [creating, startCreate] = useTransition()

  function ask() {
    setError(undefined)
    startAsk(async () => {
      const res = await adviseForJob(jobId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setAdvice(res.advice)
      setPicked(new Set(res.advice.suggestions.map((s) => s.path)))
    })
  }

  function create() {
    setError(undefined)
    startCreate(async () => {
      const chosen = (advice?.suggestions ?? [])
        .filter((s) => picked.has(s.path))
        .map((s) => ({ path: s.path, after: s.after }))
      const res = await createTailoredResume(jobId, chosen)
      // Success redirects to the editor; only a failure comes back here.
      if (res && !res.ok) setError(res.error)
    })
  }

  if (!advice) {
    return (
      <div>
        <p className="text-small text-ink-2">
          Compares this role with your master resume and About you, then suggests what to lead with and how to reword
          it. Nothing is changed until you create a copy.
        </p>
        <Button
          className="mt-2.5"
          size="sm"
          variant="subtle"
          loading={asking}
          onClick={ask}
          aria-label={`Get resume advice for ${label}`}
        >
          <span aria-hidden="true">✦</span>
          Get resume advice
        </Button>
        {asking && <span className="ml-2 text-small text-ink-3">Reading the posting…</span>}
        {error && (
          <p role="alert" className="mt-2 rounded-control bg-warning-tint px-3 py-2 text-small text-warning">
            {error}
          </p>
        )}
      </div>
    )
  }

  const chosenCount = advice.suggestions.filter((s) => picked.has(s.path)).length
  return (
    <div className="grid gap-3.5">
      <div>
        <Badge tone={FIT_LABEL[advice.fit].tone}>{FIT_LABEL[advice.fit].text}</Badge>
        {advice.headline && <p className="mt-1.5 text-small text-ink-2">{advice.headline}</p>}
      </div>

      {advice.emphasize.length > 0 && (
        <div>
          <p className="text-small font-medium text-ink">Lead with</p>
          <ul className="mt-1 grid gap-1 text-small text-ink-2">
            {advice.emphasize.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden="true" className="text-success">
                  +
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {advice.gaps.length > 0 && (
        <div>
          <p className="text-small font-medium text-ink">Gaps to be honest about</p>
          <ul className="mt-1 grid gap-1 text-small text-ink-2">
            {advice.gaps.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden="true" className="text-warning">
                  !
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {advice.suggestions.length > 0 && (
        <div>
          <p className="text-small font-medium text-ink">Reworded lines (tick the ones you want)</p>
          <ul className="mt-1.5 grid gap-2">
            {advice.suggestions.map((s) => (
              <li key={s.path} className="rounded-control border border-line p-2.5">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
                    checked={picked.has(s.path)}
                    onChange={(e) =>
                      setPicked((cur) => {
                        const next = new Set(cur)
                        if (e.target.checked) next.add(s.path)
                        else next.delete(s.path)
                        return next
                      })
                    }
                  />
                  <span className="min-w-0 text-small">
                    <span className="block text-ink-3 line-through decoration-ink-3/60">{s.before || '(empty)'}</span>
                    <span className="mt-0.5 block text-ink">{s.after}</span>
                    {s.reason && <span className="mt-0.5 block text-caption text-ink-3">{s.reason}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-control bg-warning-tint px-3 py-2 text-small text-warning">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" loading={creating} onClick={create}>
          {chosenCount > 0
            ? `Create tailored resume (${chosenCount} edit${chosenCount === 1 ? '' : 's'})`
            : 'Create a copy to edit'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAdvice(null)}>
          Ask again
        </Button>
      </div>
      <p className="text-caption text-ink-3">
        A new resume called “{label}” opens in the editor. Your master resume is never changed.
      </p>
    </div>
  )
}
