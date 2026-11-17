'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { SaveResult } from '@/app/(app)/resumes/actions'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/button'
import { cx } from '@/lib/cx'
import type { ResumeDesign } from '@/resume/design'
import { addItem, ADDABLE, type AddableSection } from '@/resume/edit-ops'
import { addBulletAfter, getAt, removeBullet, setAt } from '@/resume/paths'
import { ResumePage } from '@/resume/render'
import type { ResumeContent } from '@/resume/types'
import { AiAssistant, type AskFn } from './ai-assistant'
import { CloseUp, scopeOf } from './closeup'
import { FontPanel, StylePanel } from './design-panels'
import { useHistory } from './use-history'

type Draft = { content: ResumeContent; design: ResumeDesign; name: string; target: string }
type SaveFn = (
  id: number,
  input: { content: unknown; design: unknown; name: string; target: string },
) => Promise<SaveResult>

const PAGE_WIDTH = 794
const LIST_SECTIONS = ['experience', 'projects', 'education', 'skills', 'certifications']

/**
 * The resume editor. The page fills the left (zoomable) and every edit is on the right: fonts, styles and a
 * close-up of what you selected: one line, one entry, or a whole section (click its heading). A small AI
 * assistant sits at the bottom right. Changes are a draft until you press Save.
 */
export function Editor({
  id,
  isMaster,
  initial,
  save,
  ask,
  remove,
  importedFrom,
}: {
  id: number
  isMaster: boolean
  /** Set right after an upload: the original file's name, for a "check what was read" note. */
  importedFrom?: string
  initial: Draft
  save: SaveFn
  ask: AskFn
  remove?: (id: number) => Promise<void>
}) {
  const history = useHistory(initial.content)
  const { content, set, undo, redo, reset } = history
  const [design, setDesign] = useState<ResumeDesign>(initial.design)
  const [name, setName] = useState(initial.name)
  const [target, setTarget] = useState(initial.target)
  const [selected, setSelected] = useState<string | null>(null)
  const [showImported, setShowImported] = useState(Boolean(importedFrom))

  const contentRef = useRef(content)
  useLayoutEffect(() => {
    contentRef.current = content
  }, [content])

  /* ---------- saving: a draft until Save ---------- */

  const [saved, setSaved] = useState<Draft>(initial)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const dirty = content !== saved.content || design !== saved.design || name !== saved.name || target !== saved.target

  const saveNow = useCallback(async () => {
    if (saving) return
    setSaving(true)
    const draft = { content: contentRef.current, design, name, target }
    const res = await save(id, draft)
    setSaving(false)
    if (res.ok) {
      setSaved(draft)
      setSaveError(null)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } else setSaveError(res.error)
  }, [save, id, design, name, target, saving])

  const discard = () => {
    if (!window.confirm('Discard your changes since the last save?')) return
    reset(saved.content)
    setDesign(saved.design)
    setName(saved.name)
    setTarget(saved.target)
    setSaveError(null)
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveNow()
      }
    }
    window.addEventListener('beforeunload', warn)
    window.addEventListener('keydown', keys)
    return () => {
      window.removeEventListener('beforeunload', warn)
      window.removeEventListener('keydown', keys)
    }
  }, [dirty, saveNow])

  /** Leaving with unsaved changes asks first. */
  const guard = (e: { preventDefault: () => void }) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault()
  }

  /* ---------- in-place editing on the page ---------- */

  // While a field on the page is focused, the page keeps the text it had when focus started, so React never
  // rewrites the text under the caret. The store (and the close-up) get every keystroke.
  const [focused, setFocused] = useState<{ path: string; snapshot: string } | null>(null)
  const [pageKey, setPageKey] = useState(0)
  const needsRemount = useRef(false)
  const pendingFocus = useRef<{ path: string; atEnd: boolean } | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  const display = useMemo(
    () => (focused ? setAt(content, focused.path, focused.snapshot) : content),
    [content, focused],
  )

  const editableAt = (t: EventTarget | null) => {
    const el = (t as HTMLElement | null)?.closest?.('[data-path]') as HTMLElement | null
    return el && el.isContentEditable ? el : null
  }

  const onFocus = (e: React.FocusEvent) => {
    const el = editableAt(e.target)
    if (!el) return
    const path = el.dataset.path!
    setFocused({ path, snapshot: getAt(contentRef.current, path) ?? '' })
    setSelected(path)
  }

  const onBlur = (e: React.FocusEvent) => {
    const el = editableAt(e.target)
    if (!el) return
    setFocused((f) => (f?.path === el.dataset.path ? null : f))
    if (needsRemount.current) {
      // The field was emptied and the browser dropped its text node: rebuild the page so React owns it again.
      needsRemount.current = false
      const next = editableAt(e.relatedTarget)
      if (next) pendingFocus.current = { path: next.dataset.path!, atEnd: true }
      setPageKey((k) => k + 1)
    }
  }

  const onInput = (e: React.FormEvent) => {
    const el = editableAt(e.target)
    if (!el) return
    const path = el.dataset.path!
    let value = (el.textContent ?? '').replace(/ /g, ' ')
    if (path !== 'summary.text') value = value.replace(/\n/g, ' ')
    if (value === '') needsRemount.current = true
    set(setAt(contentRef.current, path, value), path)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = editableAt(e.target)
    if (!el) return
    const path = el.dataset.path!
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      el.blur()
      if (e.shiftKey) redo()
      else undo()
      return
    }
    if (e.key === 'Escape') return el.blur()
    if (e.key === 'Enter' && !(path === 'summary.text' && e.shiftKey)) {
      e.preventDefault()
      if (path.includes('.bullets.')) {
        const added = addBulletAfter(contentRef.current, path)
        if (added) {
          set(added.content)
          pendingFocus.current = { path: added.path, atEnd: true }
        }
      }
      el.blur()
      return
    }
    if (e.key === 'Backspace' && (el.textContent ?? '') === '' && path.includes('.bullets.')) {
      e.preventDefault()
      const prefix = path.replace(/[^.]+$/, '')
      const siblings = Array.from(pageRef.current?.querySelectorAll<HTMLElement>('[data-path]') ?? []).filter((x) =>
        x.dataset.path!.startsWith(prefix),
      )
      const i = siblings.indexOf(el)
      const prev = i > 0 ? siblings[i - 1].dataset.path : undefined
      set(removeBullet(contentRef.current, path))
      if (prev) pendingFocus.current = { path: prev, atEnd: true }
      needsRemount.current = true
      el.blur()
    }
  }

  const onClick = (e: React.MouseEvent) => {
    if (editableAt(e.target)) return
    const t = e.target as HTMLElement
    // A section heading selects the whole section; anywhere else in an entry selects the entry.
    const heading = t.closest('[data-path$=".heading"]') as HTMLElement | null
    if (heading) return setSelected(heading.dataset.path!.split('.')[0])
    const block = t.closest('[data-block]') as HTMLElement | null
    if (block) setSelected(block.dataset.block!)
  }

  useLayoutEffect(() => {
    const want = pendingFocus.current
    if (!want || !pageRef.current) return
    const el = pageRef.current.querySelector<HTMLElement>(`[data-path="${CSS.escape(want.path)}"]`)
    if (!el) return
    pendingFocus.current = null
    el.focus()
    if (want.atEnd) {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  })

  /* ---------- zoom ---------- */

  const canvasRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  const [pageHeight, setPageHeight] = useState(1123)
  const [zoom, setZoom] = useState<'fit' | number>('fit')
  useEffect(() => {
    const box = canvasRef.current
    const page = pageRef.current
    if (!box || !page) return
    const ro = new ResizeObserver(() => {
      setFit(Math.min(2, Math.max(0.3, (box.clientWidth - 2) / PAGE_WIDTH)))
      setPageHeight(page.offsetHeight)
    })
    ro.observe(box)
    ro.observe(page)
    return () => ro.disconnect()
  }, [])
  const scale = zoom === 'fit' ? fit : zoom
  const step = (d: number) => setZoom(Math.round(Math.min(2, Math.max(0.5, scale + d)) * 10) / 10)

  /* ---------- selection ---------- */

  const scope = selected ? scopeOf(content, selected) : null
  const highlight = useMemo(() => {
    const rules = [
      `.resume-canvas [contenteditable]:empty{display:inline-block;min-width:4em}`,
      `.resume-canvas [contenteditable]:empty::before{content:'Type here';color:#b6c0cf}`,
    ]
    if (!selected || !scope) return rules.join('\n')
    const ring = 'outline:1.5px solid rgb(37 99 235/.55);outline-offset:3px;border-radius:3px'
    if (scope === 'line') rules.push(`.resume-canvas [data-path="${CSS.escape(selected)}"]{${ring}}`)
    else if (scope === 'block') rules.push(`.resume-canvas [data-block="${CSS.escape(selected)}"]{${ring}}`)
    else
      rules.push(
        `.resume-canvas [data-block^="${CSS.escape(selected)}."],.resume-canvas [data-path="${CSS.escape(selected)}.heading"]{${ring}}`,
      )
    return rules.join('\n')
  }, [selected, scope])

  const select = useCallback((key: string) => {
    setSelected(key)
    const el =
      pageRef.current?.querySelector(`[data-path="${CSS.escape(key)}"]`) ??
      pageRef.current?.querySelector(`[data-block="${CSS.escape(key)}"]`) ??
      pageRef.current?.querySelector(`[data-path="${CSS.escape(key)}.heading"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  const peek = useCallback((path: string) => {
    pageRef.current
      ?.querySelector(`[data-path="${CSS.escape(path)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  const add = (section: AddableSection) => {
    const r = addItem(contentRef.current, section)
    set(r.content)
    setSelected(r.block)
    requestAnimationFrame(() =>
      pageRef.current
        ?.querySelector(`[data-block="${CSS.escape(r.block)}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    )
  }

  /* ---------- layout ---------- */

  return (
    <div className="editor-wide pb-24">
      <div className="sticky top-16 z-[5] -mx-4 mb-4 border-b border-line bg-canvas/95 px-4 py-2.5 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/resumes" onClick={guard} className="text-small font-medium text-ink-2 hover:text-ink">
            ← Resumes
          </Link>
          <label className="sr-only" htmlFor="resume-name">
            Resume name
          </label>
          <input
            id="resume-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="min-w-0 flex-1 basis-48 rounded-control border border-transparent bg-transparent px-2 py-1 text-title font-semibold hover:border-line focus:border-primary focus:bg-surface"
          />
          {isMaster && (
            <span className="rounded-full bg-primary-tint px-2 text-caption leading-5 font-semibold text-primary">
              Master
            </span>
          )}
          <label className="sr-only" htmlFor="resume-target">
            For (company or role)
          </label>
          <input
            id="resume-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="For: company or role"
            maxLength={120}
            className="w-56 max-w-full rounded-control border border-line bg-surface px-2.5 py-1.5 text-small"
          />
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className={iconButtonClass({ size: 'sm' })}
              onClick={undo}
              disabled={!history.canUndo}
              aria-label="Undo"
              title="Undo (⌘Z)"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 4L3 7l3 3M3.5 7H10a3 3 0 010 6H8" />
              </svg>
            </button>
            <button
              type="button"
              className={iconButtonClass({ size: 'sm' })}
              onClick={redo}
              disabled={!history.canRedo}
              aria-label="Redo"
              title="Redo (⇧⌘Z)"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 4l3 3-3 3M12.5 7H6a3 3 0 000 6h2" />
              </svg>
            </button>
            <AddMenu onAdd={add} />
            <Link href={`/resumes/${id}`} onClick={guard} className={buttonClass({ size: 'sm' })}>
              Preview &amp; PDF
            </Link>
            {dirty && (
              <Button size="sm" variant="ghost" onClick={discard}>
                Discard
              </Button>
            )}
            <Button
              size="sm"
              variant={dirty ? 'primary' : 'secondary'}
              onClick={() => void saveNow()}
              loading={saving}
              disabled={!dirty && !saving}
              title="Save (⌘S)"
            >
              {saving ? 'Saving' : dirty ? 'Save' : justSaved ? 'Saved ✓' : 'Saved'}
            </Button>
          </span>
        </div>
        {saveError && (
          <p className="mt-1.5 text-small text-danger" role="alert">
            Not saved: {saveError}
          </p>
        )}
      </div>

      {showImported && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-card border border-primary-tint-border bg-primary-tint/60 px-4 py-3">
          <p className="text-small text-ink">
            <b className="font-semibold">Imported from {importedFrom}.</b> The text was read automatically, so check
            each section: click a heading to see its entries, fix anything that landed in the wrong place, then Save.
            The original file stays attached to this resume.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setShowImported(false)}>
            Got it
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)]">
        {/* The page: fills the left, zoomable */}
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-ink-3">
              Click a line to edit it, a heading for the whole section. Enter adds a bullet.
            </p>
            <div className="flex items-center gap-1" role="group" aria-label="Zoom">
              <button
                type="button"
                className={iconButtonClass({ size: 'sm' })}
                onClick={() => step(-0.1)}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="w-12 text-center text-small text-ink-2 tabular-nums">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                className={iconButtonClass({ size: 'sm' })}
                onClick={() => step(0.1)}
                aria-label="Zoom in"
              >
                +
              </button>
              <Button size="sm" variant={zoom === 'fit' ? 'subtle' : 'ghost'} onClick={() => setZoom('fit')}>
                Fit
              </Button>
              <Button size="sm" variant={zoom === 1 ? 'subtle' : 'ghost'} onClick={() => setZoom(1)}>
                100%
              </Button>
            </div>
          </div>
          <div ref={canvasRef} className="resume-canvas w-full overflow-x-auto">
            <style>{highlight}</style>
            <div className="mx-auto" style={{ width: PAGE_WIDTH * scale, height: pageHeight * scale }}>
              <div
                ref={pageRef}
                style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                className="shadow-[0_1px_3px_rgb(15_23_42/.08),0_8px_28px_rgb(15_23_42/.08)] [&_[contenteditable]]:cursor-text [&_[contenteditable]]:rounded-[2px] [&_[contenteditable]]:outline-none [&_[contenteditable]:focus]:outline-[1.5px] [&_[contenteditable]:focus]:outline-offset-2 [&_[contenteditable]:focus]:outline-primary [&_[contenteditable]:focus]:outline-solid [&_[contenteditable]:hover]:outline-1 [&_[contenteditable]:hover]:outline-offset-2 [&_[contenteditable]:hover]:outline-primary/30 [&_[contenteditable]:hover]:outline-dashed [&_[data-path$='.heading']]:cursor-pointer"
                onFocus={onFocus}
                onBlur={onBlur}
                onInput={onInput}
                onKeyDown={onKeyDown}
                onClick={onClick}
              >
                <ResumePage key={pageKey} content={display} design={design} editable />
              </div>
            </div>
          </div>
        </div>

        {/* Every edit, on the right */}
        <div className="grid min-w-0 gap-4 lg:sticky lg:top-[132px] lg:max-h-[calc(100dvh-148px)] lg:overflow-y-auto lg:pr-1 lg:pb-2">
          <CloseUp
            content={content}
            design={design}
            selected={selected}
            onChange={(next, key) => set(next, key)}
            onSelect={select}
            onPeek={peek}
            dirty={dirty}
            saving={saving}
            onSave={() => void saveNow()}
          />
          <FontPanel value={design.font} onChange={(font) => setDesign({ ...design, font })} />
          <StylePanel
            content={content}
            design={design}
            onChange={(template) => setDesign({ ...design, template })}
            onAccent={(accent) => setDesign({ ...design, accent })}
          />
          {!isMaster && remove && <DeleteResume onDelete={() => remove(id)} />}
        </div>
      </div>

      <AiAssistant
        resumeId={id}
        content={content}
        block={
          selected && (scope === 'line' || scope === 'block' || LIST_SECTIONS.includes(selected)) ? selected : null
        }
        ask={ask}
        onApply={(path, value) => set(setAt(contentRef.current, path, value), `ai:${path}`)}
      />
    </div>
  )
}

function AddMenu({ onAdd }: { onAdd: (s: AddableSection) => void }) {
  const ref = useRef<HTMLDetailsElement>(null)
  return (
    <details ref={ref} className="relative">
      <summary className={cx(buttonClass({ size: 'sm' }), 'list-none [&::-webkit-details-marker]:hidden')}>
        + Add
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-56 rounded-card border border-line bg-surface p-1 shadow-pop">
        {ADDABLE.map((a) => (
          <button
            key={a.section}
            type="button"
            className="block w-full rounded-control px-3 py-2 text-left text-small hover:bg-surface-muted"
            onClick={() => {
              onAdd(a.section)
              ref.current?.removeAttribute('open')
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </details>
  )
}

function DeleteResume({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false)
  if (!confirm)
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="justify-self-start text-small text-ink-3 hover:text-danger"
      >
        Delete this resume…
      </button>
    )
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-danger/30 bg-danger-tint px-4 py-3">
      <span className="text-small font-medium text-danger">Delete this resume? This can’t be undone.</span>
      <Button size="sm" variant="danger" onClick={() => void onDelete()}>
        Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
        Keep
      </Button>
    </div>
  )
}
