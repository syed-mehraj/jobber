'use client'

import { useState, useTransition } from 'react'
import type { AboutInput, AboutResult } from '@/app/(app)/about/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cx } from '@/lib/cx'
import { ABOUT_MAX, ABOUT_TITLE_MAX } from '@/resume/about'

export type AboutItem = { id: number; title: string; target: string | null; text: string; updated: string }

type Actions = {
  create: (input: AboutInput) => Promise<AboutResult>
  update: (id: number, input: AboutInput) => Promise<AboutResult>
  duplicate: (id: number) => Promise<AboutResult>
  remove: (id: number) => Promise<AboutResult>
}

/**
 * "About you": several descriptions of your work in your own words, one per kind of application.
 * Open one to read, copy, edit, duplicate or delete it; "New" starts another.
 */
export function AboutSection({ items, actions }: { items: AboutItem[]; actions: Actions }) {
  const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null)
  const [editing, setEditing] = useState<number | 'new' | null>(null)

  return (
    <Card aria-labelledby="about-title">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 id="about-title" className="text-title font-semibold">
            {items.length} description{items.length === 1 ? '' : 's'}
          </h2>
          <p className="text-caption text-ink-3">Most recently edited first</p>
        </div>
        {editing !== 'new' && (
          <Button size="sm" onClick={() => setEditing('new')}>
            + New
          </Button>
        )}
      </div>

      {editing === 'new' && (
        <div className="border-b border-line">
          <AboutForm
            initial={{ title: '', target: '', text: '' }}
            onCancel={() => setEditing(null)}
            onSave={async (input) => {
              const res = await actions.create(input)
              if (res.ok) {
                setEditing(null)
                if (res.id) setOpenId(res.id)
              }
              return res
            }}
          />
        </div>
      )}

      {items.length === 0 && editing !== 'new' ? (
        <p className="px-5 py-6 text-small text-ink-2">
          Write a few lines about what you do, in your own words. Keep one for each kind of role you apply to.
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b border-line last:border-b-0">
              {editing === item.id ? (
                <AboutForm
                  initial={{ title: item.title, target: item.target ?? '', text: item.text }}
                  onCancel={() => setEditing(null)}
                  onSave={async (input) => {
                    const res = await actions.update(item.id, input)
                    if (res.ok) setEditing(null)
                    return res
                  }}
                />
              ) : (
                <AboutEntry
                  item={item}
                  open={openId === item.id}
                  onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                  onEdit={() => setEditing(item.id)}
                  actions={actions}
                  onDuplicated={(id) => setOpenId(id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function AboutEntry({
  item,
  open,
  onToggle,
  onEdit,
  actions,
  onDuplicated,
}: {
  item: AboutItem
  open: boolean
  onToggle: () => void
  onEdit: () => void
  actions: Actions
  onDuplicated: (id: number) => void
}) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, start] = useTransition()
  const panelId = `about-${item.id}`

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left hover:bg-surface-muted"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{item.title}</span>
          <span className="block truncate text-caption text-ink-3">
            {item.target ? `For ${item.target} · ` : ''}
            {item.updated}
          </span>
        </span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cx('mt-1 size-4 shrink-0 text-ink-3 transition-transform', open && 'rotate-180')}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div id={panelId} className="px-5 pb-4">
          <div className="grid gap-3 text-small leading-relaxed text-ink-2">
            {item.text.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
          {confirming ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-control bg-danger-tint px-3 py-2">
              <span className="text-small font-medium text-danger">Delete “{item.title}”?</span>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => start(async () => void (await actions.remove(item.id)))}
              >
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Keep
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(item.text)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  } catch {
                    setCopied(false)
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const res = await actions.duplicate(item.id)
                    if (res.ok && res.id) onDuplicated(res.id)
                  })
                }
              >
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger! hover:text-danger!"
                onClick={() => setConfirming(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AboutForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AboutInput
  onSave: (input: AboutInput) => Promise<AboutResult>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <form
      className="grid gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await onSave(draft)
          if (!res.ok) setError(res.error ?? 'Could not save.')
        })
      }}
    >
      <Input
        label="Title"
        placeholder="e.g. AI Engineer roles"
        value={draft.title}
        maxLength={ABOUT_TITLE_MAX}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        autoFocus
      />
      <Input
        label="For (optional)"
        placeholder="Company or role, e.g. Salesforce admin at Acme"
        value={draft.target}
        maxLength={ABOUT_TITLE_MAX}
        onChange={(e) => setDraft({ ...draft, target: e.target.value })}
      />
      <div className="grid gap-1.5">
        <label htmlFor="about-text" className="text-small font-medium text-ink-2">
          Description
        </label>
        <textarea
          id="about-text"
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          rows={12}
          maxLength={ABOUT_MAX}
          className="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2.5 text-small leading-relaxed text-ink focus:border-primary"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={error ? 'text-small text-danger' : 'text-caption text-ink-3'} aria-live="polite">
          {error ?? `${draft.text.length} / ${ABOUT_MAX}`}
        </span>
        <span className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" type="submit" loading={pending}>
            Save
          </Button>
        </span>
      </div>
    </form>
  )
}
