'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cx } from '@/lib/cx'
import type { ResumeDesign } from '@/resume/design'
import { addSkill, removeItem, removeSkill, setHidden } from '@/resume/edit-ops'
import { addBullet, blockLabel, fieldsOf, moveBullet, removeBullet, setAt, type FieldInfo } from '@/resume/paths'
import { ResumeBlock } from '@/resume/render'
import type { ResumeContent, SectionKey } from '@/resume/types'

const BLOCK_PREVIEW_WIDTH = 794

/**
 * The close-up: the selected part of the resume shown larger, exactly as it will look, with every field
 * of that part editable underneath. Edits here show on the page at once, and the other way round.
 */
export function CloseUp({
  content,
  design,
  block,
  selected,
  onChange,
  onSelect,
  onSelectBlock,
}: {
  content: ResumeContent
  design: ResumeDesign
  block: string | null
  selected: string | null
  onChange: (next: ResumeContent, key?: string) => void
  onSelect: (path: string) => void
  onSelectBlock: (block: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  // Keep the field that matches the page selection in view.
  useEffect(() => {
    if (!selected) return
    listRef.current
      ?.querySelector(`[data-field="${CSS.escape(selected)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  // Scale the block preview to the panel's width (it is rendered at full page width).
  useEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box || !inner) return
    const ro = new ResizeObserver(() => {
      const s = box.clientWidth / BLOCK_PREVIEW_WIDTH
      inner.style.transform = `scale(${s})`
      box.style.height = `${inner.offsetHeight * s}px`
    })
    ro.observe(box)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [block])

  if (!block) {
    return (
      <Card className="px-5 py-6">
        <h2 className="text-title font-semibold">Close-up</h2>
        <p className="mt-1 text-small text-ink-2">
          Click any part of the resume to see it up close here and edit every field of it.
        </p>
      </Card>
    )
  }

  const section = block.split('.')[0] as SectionKey
  const fields = fieldsOf(content, block)
  const bulletBlock = ['experience', 'projects', 'education', 'custom'].includes(section)
  const skillGroup = section === 'skills' ? block.split('.')[1] : null

  return (
    <Card aria-labelledby="closeup-title" className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-caption font-semibold tracking-wide text-ink-3 uppercase">Close-up</p>
          <h2 id="closeup-title" className="truncate text-title font-semibold">
            {blockLabel(content, block)}
          </h2>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-small text-ink-2">
          <input
            type="checkbox"
            checked={!content[section].hidden}
            onChange={(e) => onChange(setHidden(content, section, !e.target.checked))}
            className="size-4 accent-[var(--color-primary)]"
          />
          Show section
        </label>
      </div>

      {/* How it looks, larger */}
      <div className="border-b border-line bg-surface-muted px-4 py-4">
        <div ref={boxRef} className="overflow-hidden rounded-[4px] bg-white shadow-[0_1px_2px_rgb(15_23_42/.06)]">
          <div
            ref={innerRef}
            style={{ width: BLOCK_PREVIEW_WIDTH, transformOrigin: 'top left' }}
            className="px-10 py-5"
          >
            <ResumeBlock content={content} design={design} block={block} />
          </div>
        </div>
      </div>

      {/* Every field of this part */}
      <div ref={listRef} className="grid gap-3 px-5 py-4">
        {fields.map((f) => (
          <Field
            key={f.path}
            field={f}
            active={selected === f.path}
            onFocus={() => onSelect(f.path)}
            onChange={(v) => onChange(setAt(content, f.path, v), f.path)}
            tools={
              f.path.includes('.bullets.') ? (
                <>
                  <Tool label="Move up" onClick={() => onChange(moveBullet(content, f.path, -1))}>
                    ↑
                  </Tool>
                  <Tool label="Move down" onClick={() => onChange(moveBullet(content, f.path, 1))}>
                    ↓
                  </Tool>
                  <Tool label="Remove bullet" onClick={() => onChange(removeBullet(content, f.path))}>
                    ×
                  </Tool>
                </>
              ) : f.path.includes('.items.') && skillGroup ? (
                <Tool label="Remove skill" onClick={() => onChange(removeSkill(content, f.path))}>
                  ×
                </Tool>
              ) : null
            }
          />
        ))}

        <div className="flex flex-wrap gap-2 pt-1">
          {bulletBlock && (
            <Button
              size="sm"
              onClick={() => {
                const r = addBullet(content, block)
                if (r) {
                  onChange(r.content)
                  onSelect(r.path)
                }
              }}
            >
              + Bullet
            </Button>
          )}
          {skillGroup && (
            <Button
              size="sm"
              onClick={() => {
                const r = addSkill(content, skillGroup)
                if (r) {
                  onChange(r.content)
                  onSelect(r.path)
                }
              }}
            >
              + Skill
            </Button>
          )}
          {block.includes('.') && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-danger! hover:text-danger!"
              onClick={() => {
                onChange(removeItem(content, block))
                onSelectBlock(section)
              }}
            >
              Remove this entry
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function Field({
  field,
  active,
  onFocus,
  onChange,
  tools,
}: {
  field: FieldInfo
  active: boolean
  onFocus: () => void
  onChange: (value: string) => void
  tools: React.ReactNode
}) {
  const id = `f-${field.path.replace(/[^a-zA-Z0-9-]/g, '_')}`
  const cls = cx(
    'w-full rounded-control border bg-surface px-3 py-2 text-small text-ink focus:border-primary',
    active ? 'border-primary-tint-border bg-primary-tint/30' : 'border-line-strong',
  )
  return (
    <div data-field={field.path} className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-caption font-medium text-ink-2">
          {field.label}
        </label>
        {tools && <span className="flex gap-0.5">{tools}</span>}
      </div>
      {field.multiline ? (
        <textarea
          id={id}
          value={field.value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(6, Math.max(2, Math.ceil(field.value.length / 70)))}
          className={cx(cls, 'resize-y leading-relaxed')}
        />
      ) : (
        <input
          id={id}
          value={field.value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          className={cx(cls, 'h-9')}
        />
      )}
    </div>
  )
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-control text-small text-ink-3 hover:bg-surface-muted hover:text-ink"
    >
      {children}
    </button>
  )
}
