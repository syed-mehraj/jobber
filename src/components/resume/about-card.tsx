'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ABOUT_MAX } from '@/resume/about'

/**
 * "About you": the owner's own description of their work, in their words. Read it, copy it into an
 * application, or edit it. Saved in settings, separate from the resumes.
 */
export function AboutCard({
  text,
  updated,
  save,
}: {
  text: string
  updated: string | null
  save: (text: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()

  return (
    <Card aria-labelledby="about-title">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 id="about-title" className="text-title font-semibold">
            About you
          </h2>
          <p className="text-caption text-ink-3">Your own description of your work{updated ? ` · ${updated}` : ''}</p>
        </div>
        {!editing && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={!text}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDraft(text)
                setError(null)
                setEditing(true)
              }}
            >
              Edit
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <form
          className="grid gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            start(async () => {
              const res = await save(draft)
              if (res.ok) setEditing(false)
              else setError(res.error ?? 'Could not save.')
            })
          }}
        >
          <label htmlFor="about-text" className="sr-only">
            About you
          </label>
          <textarea
            id="about-text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            maxLength={ABOUT_MAX}
            autoFocus
            className="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2.5 text-small leading-relaxed text-ink focus:border-primary"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={error ? 'text-small text-danger' : 'text-caption text-ink-3'} aria-live="polite">
              {error ?? `${draft.length} / ${ABOUT_MAX}`}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" type="submit" loading={pending}>
                Save
              </Button>
            </span>
          </div>
        </form>
      ) : text ? (
        <div className="grid max-h-[560px] gap-3 overflow-y-auto px-5 py-4 text-small leading-relaxed text-ink-2">
          {text.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : (
        <p className="px-5 py-6 text-small text-ink-2">
          Write a few lines about what you do, in your own words. It’s handy for applications and for tailoring resumes.
        </p>
      )}
    </Card>
  )
}
