'use client'

import { useRef, useState, useTransition } from 'react'
import type { AssistantInput, AssistantResult } from '@/app/(app)/resumes/ai-actions'
import { Button } from '@/components/ui/button'
import { cx } from '@/lib/cx'
import type { Suggestion } from '@/resume/ai'
import { blockLabel, getAt } from '@/resume/paths'
import type { ResumeContent } from '@/resume/types'

export type AskFn = (input: AssistantInput) => Promise<AssistantResult>

const QUICK = [
  'Make the bullets more impact-focused',
  'Fix grammar and tighten the wording',
  'Shorten this to fit one page',
  'Write a summary for an AI/ML engineer role',
]

type Item = Suggestion & { state: 'open' | 'accepted' | 'skipped' }

/**
 * A small assistant pinned to the bottom right: type what you want, get suggested edits, accept or
 * skip each one. Nothing changes until you accept. Uses Gemini on the server; it may not add facts.
 */
export function AiAssistant({
  resumeId,
  content,
  block,
  ask,
  onApply,
}: {
  resumeId: number
  content: ResumeContent
  block: string | null
  ask: AskFn
  onApply: (path: string, value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [scope, setScope] = useState<'resume' | 'block'>('resume')
  const [showJob, setShowJob] = useState(false)
  const [job, setJob] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const useBlock = scope === 'block' && block
  const send = (text: string) => {
    const p = text.trim()
    if (!p) return
    setError(null)
    setMessage(null)
    setItems([])
    start(async () => {
      const res = await ask({
        resumeId,
        content,
        prompt: p,
        focusBlock: useBlock ? block! : undefined,
        jobDescription: showJob && job.trim() ? job.trim() : undefined,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMessage(res.message)
      setItems(res.suggestions.map((s) => ({ ...s, state: 'open' })))
    })
  }

  const accept = (i: number) => {
    const s = items[i]
    onApply(s.path, s.after)
    setItems((list) => list.map((x, j) => (j === i ? { ...x, state: 'accepted' } : x)))
  }
  const acceptAll = () => items.forEach((s, i) => s.state === 'open' && accept(i))
  const openCount = items.filter((s) => s.state === 'open').length

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
        className="fixed right-4 bottom-4 z-20 inline-flex h-11 items-center gap-2 rounded-full border border-primary-tint-border bg-surface px-4 font-medium text-primary shadow-pop hover:bg-primary-tint sm:right-6 sm:bottom-6"
      >
        <span aria-hidden="true">✦</span> AI assistant
      </button>
    )
  }

  return (
    <section
      aria-label="AI assistant"
      className="fixed right-3 bottom-3 z-20 flex max-h-[min(640px,calc(100dvh-96px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-drawer sm:right-6 sm:bottom-6"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true" className="text-primary">
            ✦
          </span>
          AI assistant
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          className="grid size-8 place-items-center rounded-control text-ink-3 hover:bg-surface-muted hover:text-ink"
        >
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <p className="mb-3 rounded-control bg-warning-tint px-3 py-2 text-small text-warning" role="alert">
            {error}
          </p>
        )}
        {message && <p className="mb-3 text-small text-ink-2">{message}</p>}
        {pending && <p className="mb-3 text-small text-ink-3">Thinking…</p>}

        {items.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-caption font-semibold tracking-wide text-ink-3 uppercase">
                {items.length} suggestion{items.length === 1 ? '' : 's'}
              </p>
              {openCount > 1 && (
                <Button size="sm" variant="subtle" onClick={acceptAll}>
                  Accept all
                </Button>
              )}
            </div>
            <ul className="grid gap-2.5">
              {items.map((s, i) => (
                <li
                  key={s.path}
                  className={cx('rounded-control border border-line p-3', s.state !== 'open' && 'opacity-60')}
                >
                  <p className="text-caption text-ink-3">{labelFor(content, s.path)}</p>
                  <p className="mt-1 text-small text-ink-3 line-through decoration-ink-3/60">{s.before || '(empty)'}</p>
                  <p className="mt-1 text-small text-ink">{s.after}</p>
                  {s.reason && <p className="mt-1 text-caption text-ink-3">{s.reason}</p>}
                  <div className="mt-2 flex items-center gap-1.5">
                    {s.state === 'open' ? (
                      <>
                        <Button size="sm" variant="subtle" onClick={() => accept(i)}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setItems((list) => list.map((x, j) => (j === i ? { ...x, state: 'skipped' } : x)))
                          }
                        >
                          Skip
                        </Button>
                      </>
                    ) : (
                      <span className="text-caption font-medium text-ink-2">
                        {s.state === 'accepted' ? 'Applied — undo with ⌘Z' : 'Skipped'}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {!items.length && !pending && !message && !error && (
          <div className="grid gap-1.5">
            <p className="text-small text-ink-2">Ask for changes in plain words. You approve every edit.</p>
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setPrompt(q)
                  send(q)
                }}
                className="rounded-control border border-line px-3 py-2 text-left text-small text-ink-2 hover:border-line-strong hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="grid gap-2 border-t border-line px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(prompt)
        }}
      >
        <div className="flex flex-wrap items-center gap-1.5 text-caption">
          <span className="text-ink-3">Edit:</span>
          <Chip on={scope === 'resume'} onClick={() => setScope('resume')}>
            Whole resume
          </Chip>
          <Chip on={scope === 'block'} onClick={() => setScope('block')} disabled={!block}>
            {block ? blockLabel(content, block) : 'Selected part'}
          </Chip>
          <Chip on={showJob} onClick={() => setShowJob((v) => !v)}>
            + Job description
          </Chip>
        </div>
        {showJob && (
          <textarea
            value={job}
            onChange={(e) => setJob(e.target.value)}
            rows={3}
            maxLength={8000}
            placeholder="Paste the job description to tailor to it"
            aria-label="Job description"
            className="w-full resize-y rounded-control border border-line-strong px-3 py-2 text-small"
          />
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(prompt)
              }
            }}
            rows={2}
            maxLength={1000}
            placeholder="Just give the prompt…"
            aria-label="What should the assistant do?"
            className="min-h-[44px] flex-1 resize-none rounded-control border border-line-strong px-3 py-2 text-small focus:border-primary"
          />
          <Button type="submit" variant="primary" loading={pending} disabled={!prompt.trim()}>
            Send
          </Button>
        </div>
      </form>
    </section>
  )
}

function Chip({
  on,
  onClick,
  disabled,
  children,
}: {
  on: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'max-w-[180px] truncate rounded-full border px-2.5 py-0.5 font-medium disabled:opacity-45',
        on ? 'border-primary-tint-border bg-primary-tint text-primary' : 'border-line text-ink-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function labelFor(content: ResumeContent, path: string): string {
  const parts = path.split('.')
  const field = parts.includes('bullets') ? 'bullet' : parts.at(-1)
  const block = ['contact', 'summary', 'custom'].includes(parts[0]) ? parts[0] : `${parts[0]}.${parts[1]}`
  return `${blockLabel(content, block)} · ${field}${getAt(content, path) === undefined ? ' (gone)' : ''}`
}
