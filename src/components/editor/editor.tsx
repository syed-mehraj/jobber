'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { SaveResult } from '@/app/(app)/resumes/actions'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/button'
import { cx } from '@/lib/cx'
import type { ResumeDesign } from '@/resume/design'
import { addItem, ADDABLE, type AddableSection } from '@/resume/edit-ops'
import { addBulletAfter, blockOf, getAt, removeBullet, setAt } from '@/resume/paths'
import { ResumePage } from '@/resume/render'
import type { ResumeContent } from '@/resume/types'
import { AiAssistant, type AskFn } from './ai-assistant'
import { CloseUp } from './closeup'
import { FontPanel, StylePanel } from './design-panels'
import { useHistory } from './use-history'

type Initial = { content: ResumeContent; design: ResumeDesign; name: string; target: string }
type SaveFn = (
  id: number,
  input: { content: unknown; design: unknown; name: string; target: string },
) => Promise<SaveResult>

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'

const PAGE_WIDTH = 794

/**
 * The resume editor, laid out as sketched: the page on the left, where any text can be clicked and
 * edited in place; on the right, fonts, styles and a close-up of the part being edited; and a small AI
 * assistant at the bottom right. Everything edits one store, so the page and the close-up stay in sync.
 */
export function Editor({
  id,
  isMaster,
  initial,
  save,
  ask,
  remove,
}: {
  id: number
  isMaster: boolean
  initial: Initial
  save: SaveFn
  ask: AskFn
  remove?: (id: number) => Promise<void>
}) {
  const history = useHistory(initial.content)
  const { content, set, undo, redo } = history
  const [design, setDesign] = useState<ResumeDesign>(initial.design)
  const [name, setName] = useState(initial.name)
  const [target, setTarget] = useState(initial.target)
  const [selected, setSelected] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [saveError, setSaveError] = useState<string | null>(null)

  // The latest content, for event handlers that must not re-bind on every keystroke.
  const contentRef = useRef(content)
  useLayoutEffect(() => {
    contentRef.current = content
  }, [content])

  /* ---------- in-place editing on the page ---------- */

  // While a field on the page is focused, the page keeps showing the text it had when focus started, so React
  // never rewrites the text under the caret. The store (and the close-up) get every keystroke.
  const [focused, setFocused] = useState<{ path: string; snapshot: string } | null>(null)
  const [pageKey, setPageKey] = useState(0)
  const needsRemount = useRef(false)
  const pendingFocus = useRef<{ path: string; atEnd: boolean } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const display = useMemo(
    () => (focused ? setAt(content, focused.path, focused.snapshot) : content),
    [content, focused],
  )

  const editableAt = (target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest?.('[data-path]') as HTMLElement | null
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
    // If the browser removed the text node (the field was emptied), rebuild the page so React owns it again.
    if (needsRemount.current) {
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
    const multiline = path === 'summary.text'
    let value = (el.textContent ?? '').replace(/ /g, ' ')
    if (!multiline) value = value.replace(/\n/g, ' ')
    if (value === '') needsRemount.current = true
    set(setAt(contentRef.current, path, value), path)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = editableAt(e.target)
    if (!el) return
    const path = el.dataset.path!
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      el.blur()
      if (e.shiftKey) redo()
      else undo()
      return
    }
    if (e.key === 'Escape') {
      el.blur()
      return
    }
    if (e.key === 'Enter' && !(path === 'summary.text' && e.shiftKey)) {
      e.preventDefault()
      if (path.includes('.bullets.')) {
        // Enter in a bullet starts a new bullet below it.
        const added = addBulletAfter(contentRef.current, path)
        if (added) {
          set(added.content)
          pendingFocus.current = { path: added.path, atEnd: true }
          el.blur()
        }
      } else el.blur()
      return
    }
    if (e.key === 'Backspace' && (el.textContent ?? '') === '' && path.includes('.bullets.')) {
      // Backspace in an empty bullet removes it and moves to the bullet above.
      e.preventDefault()
      const siblings = Array.from(
        canvasRef.current?.querySelectorAll<HTMLElement>(`[data-path^="${path.replace(/[^.]+$/, '')}"]`) ?? [],
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
    const block = (e.target as HTMLElement).closest('[data-block]') as HTMLElement | null
    if (block) setSelected(block.dataset.block!)
  }

  // Put the caret where an action asked for it (a new bullet, the field above…).
  useLayoutEffect(() => {
    const want = pendingFocus.current
    if (!want || !canvasRef.current) return
    const el = canvasRef.current.querySelector<HTMLElement>(`[data-path="${CSS.escape(want.path)}"]`)
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

  /* ---------- page scaling ---------- */

  const [scale, setScale] = useState(1)
  const [pageHeight, setPageHeight] = useState(1123)
  const pageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = canvasRef.current
    const page = pageRef.current
    if (!box || !page) return
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, box.clientWidth / PAGE_WIDTH))
      setPageHeight(page.offsetHeight)
    })
    ro.observe(box)
    ro.observe(page)
    return () => ro.disconnect()
  }, [])

  /* ---------- saving ---------- */

  const firstRender = useRef(true)
  const saveNow = useCallback(async () => {
    setSaveState('saving')
    const res = await save(id, { content: contentRef.current, design, name, target })
    if (res.ok) {
      setSaveState('saved')
      setSaveError(null)
    } else {
      setSaveState('error')
      setSaveError(res.error)
    }
  }, [save, id, design, name, target])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setSaveState('unsaved')
    const t = setTimeout(saveNow, 1200)
    return () => clearTimeout(t)
  }, [content, design, name, target, saveNow])

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState !== 'saved') e.preventDefault()
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
  }, [saveState, saveNow])

  /* ---------- selection helpers ---------- */

  const block = selected
    ? selected.includes('.') && !selected.startsWith('summary')
      ? blockOf(selected)
      : selected
    : null
  const highlight = useMemo(() => {
    const rules: string[] = [
      // An emptied field keeps a clickable width and shows a faint hint.
      `.resume-canvas [contenteditable]:empty{display:inline-block;min-width:4em}`,
      `.resume-canvas [contenteditable]:empty::before{content:'Type here';color:#b6c0cf}`,
    ]
    if (block)
      rules.push(
        `.resume-canvas [data-block="${CSS.escape(block)}"]{background:rgb(37 99 235/.045);box-shadow:0 0 0 6px rgb(37 99 235/.045);border-radius:4px}`,
      )
    if (selected && selected !== block)
      rules.push(
        `.resume-canvas [data-path="${CSS.escape(selected)}"]{outline:2px solid rgb(37 99 235/.5);outline-offset:2px;border-radius:2px}`,
      )
    return rules.join('\n')
  }, [block, selected])

  const selectFromCloseUp = useCallback((path: string) => {
    setSelected(path)
    const el = canvasRef.current?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  const add = (section: AddableSection) => {
    const r = addItem(contentRef.current, section)
    set(r.content)
    setSelected(r.block)
    requestAnimationFrame(() =>
      canvasRef.current
        ?.querySelector(`[data-block="${CSS.escape(r.block)}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    )
  }

  /* ---------- layout ---------- */

  return (
    <div className="pb-24">
      {/* Toolbar */}
      <div className="sticky top-16 z-[5] -mx-4 mb-5 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/resumes" className="text-small font-medium text-ink-2 hover:text-ink">
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
          <span
            className={cx('text-small', saveState === 'error' ? 'text-danger' : 'text-ink-3')}
            aria-live="polite"
            title={saveError ?? undefined}
          >
            {saveState === 'saved'
              ? 'Saved'
              : saveState === 'saving'
                ? 'Saving…'
                : saveState === 'unsaved'
                  ? 'Unsaved'
                  : 'Not saved'}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
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
            <Link href={`/resumes/${id}`} className={buttonClass({ size: 'sm' })}>
              Preview &amp; PDF
            </Link>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* The page: click any text to edit it */}
        <div className="min-w-0 lg:col-span-7">
          <p className="mb-2 text-caption text-ink-3">
            Click any text to edit it. Enter adds a bullet; Backspace on an empty bullet removes it.
          </p>
          <div ref={canvasRef} className="resume-canvas w-full">
            <style>{highlight}</style>
            <div style={{ height: pageHeight * scale }} className="overflow-hidden">
              <div
                ref={pageRef}
                style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                className="rounded-[4px] shadow-[0_1px_3px_rgb(15_23_42/.08),0_8px_28px_rgb(15_23_42/.08)] [&_[contenteditable]]:cursor-text [&_[contenteditable]]:rounded-[2px] [&_[contenteditable]]:outline-none [&_[contenteditable]:focus]:bg-primary-tint/50 [&_[contenteditable]:hover]:bg-primary-tint/40"
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

        {/* Fonts, styles and the close-up */}
        <div className="grid gap-4 lg:sticky lg:top-[140px] lg:col-span-5 lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto lg:pb-2">
          <FontPanel value={design.font} onChange={(font) => setDesign({ ...design, font })} />
          <StylePanel
            content={content}
            design={design}
            onChange={(template) => setDesign({ ...design, template })}
            onAccent={(accent) => setDesign({ ...design, accent })}
          />
          <CloseUp
            content={content}
            design={design}
            block={block}
            selected={selected}
            onChange={(next, key) => set(next, key)}
            onSelect={selectFromCloseUp}
            onSelectBlock={setSelected}
          />
          {!isMaster && remove && <DeleteResume onDelete={() => remove(id)} />}
        </div>
      </div>

      <AiAssistant
        resumeId={id}
        content={content}
        block={block}
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
