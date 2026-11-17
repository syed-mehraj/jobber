'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cx } from '@/lib/cx'
import type { ResumeDesign } from '@/resume/design'
import {
  addItem,
  addSkill,
  moveSection,
  removeItem,
  removeSkill,
  setHidden,
  type AddableSection,
} from '@/resume/edit-ops'
import {
  addBullet,
  blockLabel,
  blockOf,
  fieldsOf,
  getAt,
  moveBullet,
  removeBullet,
  setAt,
  type FieldInfo,
} from '@/resume/paths'
import { ResumeBlock } from '@/resume/render'
import type { ResumeContent, SectionKey } from '@/resume/types'

const PREVIEW_WIDTH = 794
const LIST_SECTIONS = ['experience', 'projects', 'education', 'skills', 'certifications']

export type Scope = 'line' | 'block' | 'section'

/** What a selection key refers to: one line of text, one entry, or a whole list section. */
export function scopeOf(content: ResumeContent, key: string): Scope {
  if (getAt(content, key) !== undefined) return 'line'
  if (LIST_SECTIONS.includes(key)) return 'section'
  return 'block'
}

/**
 * The close-up, on the right. It edits exactly what you selected on the page:
 * - a line: that one field, shown larger, with its bullet tools;
 * - an entry: all of its fields;
 * - a section (click its heading): show or hide it, move it, add entries, jump to any entry.
 */
export function CloseUp({
  content,
  design,
  selected,
  onChange,
  onSelect,
  onPeek,
  dirty,
  saving,
  onSave,
}: {
  content: ResumeContent
  design: ResumeDesign
  selected: string | null
  onChange: (next: ResumeContent, key?: string) => void
  onSelect: (key: string) => void
  /** Scroll the page to a line without changing what the panel shows. */
  onPeek: (path: string) => void
  dirty: boolean
  saving: boolean
  onSave: () => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  if (!selected || (scopeOf(content, selected) !== 'section' && fieldsOf(content, selected).length === 0)) {
    return (
      <Card className="px-5 py-5">
        <p className="text-caption font-semibold tracking-wide text-ink-3 uppercase">Edit</p>
        <h2 className="mt-0.5 text-title font-semibold">Select something on the resume</h2>
        <p className="mt-1 text-small text-ink-2">
          Click a line to edit just that line, click inside an entry for the whole entry, or click a section heading
          (Experience, Projects…) for the whole section.
        </p>
      </Card>
    )
  }

  const scope = scopeOf(content, selected)
  const section = selected.split('.')[0] as SectionKey
  const block = scope === 'line' ? blockOf(selected) : scope === 'block' ? selected : null

  return (
    <Card aria-labelledby="closeup-title" className="overflow-hidden">
      <div className="border-b border-line px-5 py-3.5">
        <p className="text-caption font-semibold tracking-wide text-ink-3 uppercase">
          {scope === 'line' ? 'Edit line' : scope === 'block' ? 'Edit entry' : 'Edit section'}
        </p>
        <h2 id="closeup-title" className="truncate text-title font-semibold">
          {blockLabel(content, selected)}
        </h2>
        {/* Breadcrumb: widen the selection */}
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-caption">
          {scope === 'line' && block && block !== section && <Crumb onClick={() => onSelect(block)}>Whole entry</Crumb>}
          {scope !== 'section' && LIST_SECTIONS.includes(section) && (
            <Crumb onClick={() => onSelect(section)}>Whole {section} section</Crumb>
          )}
        </div>
      </div>

      {scope === 'section' ? (
        <SectionEditor content={content} section={section} onChange={onChange} onSelect={onSelect} />
      ) : (
        <>
          {block && (
            <Preview content={content} design={design} block={block} line={scope === 'line' ? selected : null} />
          )}
          <FieldsEditor
            listRef={listRef}
            content={content}
            target={selected}
            block={block!}
            section={section}
            onChange={onChange}
            onSelect={onSelect}
            onPeek={onPeek}
          />
        </>
      )}

      {dirty && (
        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-muted px-5 py-3">
          <span className="text-small text-ink-2">You have unsaved changes.</span>
          <Button size="sm" variant="primary" loading={saving} onClick={onSave}>
            Save changes
          </Button>
        </div>
      )}
    </Card>
  )
}

function Crumb({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-line px-2.5 py-0.5 font-medium text-ink-2 hover:border-line-strong hover:text-ink"
    >
      {children}
    </button>
  )
}

/** The entry rendered larger, exactly as it looks, with the selected line marked. */
function Preview({
  content,
  design,
  block,
  line,
}: {
  content: ResumeContent
  design: ResumeDesign
  block: string
  line: string | null
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box || !inner) return
    const ro = new ResizeObserver(() => {
      const s = box.clientWidth / PREVIEW_WIDTH
      inner.style.transform = `scale(${s})`
      box.style.height = `${inner.offsetHeight * s}px`
    })
    ro.observe(box)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [block])
  return (
    <div className="closeup-preview border-b border-line bg-surface-muted px-4 py-4">
      {line && (
        <style>{`.closeup-preview [data-path="${CSS.escape(line)}"]{background:#eaf1ff;box-shadow:0 0 0 3px #eaf1ff;border-radius:2px}`}</style>
      )}
      <div ref={boxRef} className="overflow-hidden rounded-[4px] bg-white shadow-[0_1px_2px_rgb(15_23_42/.06)]">
        <div ref={innerRef} style={{ width: PREVIEW_WIDTH, transformOrigin: 'top left' }}>
          <ResumeBlock content={content} design={design} block={block} />
        </div>
      </div>
    </div>
  )
}

function FieldsEditor({
  listRef,
  content,
  target,
  block,
  section,
  onChange,
  onSelect,
  onPeek,
}: {
  listRef: React.RefObject<HTMLDivElement | null>
  content: ResumeContent
  target: string
  block: string
  section: SectionKey
  onChange: (next: ResumeContent, key?: string) => void
  onSelect: (key: string) => void
  onPeek: (path: string) => void
}) {
  const fields = fieldsOf(content, target)
  const single = fields.length === 1
  const skillGroup = section === 'skills' ? block.split('.')[1] : null
  const bulletBlock = ['experience', 'projects', 'education', 'custom'].includes(section)

  return (
    <div ref={listRef} className="grid gap-3 px-5 py-4">
      {fields.map((f) => (
        <Field
          key={f.path}
          field={f}
          large={single}
          onFocus={() => onPeek(f.path)}
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
                <Tool
                  label="Remove bullet"
                  onClick={() => {
                    onChange(removeBullet(content, f.path))
                    onSelect(block)
                  }}
                >
                  ×
                </Tool>
              </>
            ) : f.path.includes('.items.') && skillGroup ? (
              <Tool
                label="Remove skill"
                onClick={() => {
                  onChange(removeSkill(content, f.path))
                  onSelect(block)
                }}
              >
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
        {!single && block.includes('.') && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-danger! hover:text-danger!"
            onClick={() => {
              onChange(removeItem(content, block))
              onSelect(section)
            }}
          >
            Remove this entry
          </Button>
        )}
      </div>
    </div>
  )
}

const ADD_FOR: Partial<Record<SectionKey, AddableSection>> = {
  experience: 'experience',
  projects: 'projects',
  education: 'education',
  skills: 'skills',
  certifications: 'certifications',
}

/** A whole section: visibility, position, its entries, and adding one. */
function SectionEditor({
  content,
  section,
  onChange,
  onSelect,
}: {
  content: ResumeContent
  section: SectionKey
  onChange: (next: ResumeContent) => void
  onSelect: (key: string) => void
}) {
  const entries =
    section === 'skills'
      ? content.skills.groups.map((g) => ({ key: `skills.${g.id}`, title: g.label, meta: `${g.items.length} skills` }))
      : (content[section] as { items: Record<string, unknown>[] }).items.map((i) => ({
          key: `${section}.${i.id}`,
          title: String(i.company ?? i.name ?? i.school ?? 'Entry'),
          meta: [i.role, i.degree, i.stack, i.issuer].filter(Boolean).join(' · ') || '',
        }))
  const pos = content.order.indexOf(section)
  const addable = ADD_FOR[section]

  return (
    <div className="grid gap-4 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="mr-auto flex items-center gap-2 text-small text-ink-2">
          <input
            type="checkbox"
            checked={!content[section].hidden}
            onChange={(e) => onChange(setHidden(content, section, !e.target.checked))}
            className="size-4 accent-[var(--color-primary)]"
          />
          Show on the resume
        </label>
        <Button
          size="sm"
          variant="ghost"
          disabled={pos <= 1}
          onClick={() => onChange(moveSection(content, section, -1))}
        >
          ↑ Move up
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pos === content.order.length - 1}
          onClick={() => onChange(moveSection(content, section, 1))}
        >
          ↓ Move down
        </Button>
      </div>
      <ul className="grid gap-1.5">
        {entries.map((e) => (
          <li key={e.key}>
            <button
              type="button"
              onClick={() => onSelect(e.key)}
              className="flex w-full items-center justify-between gap-3 rounded-control border border-line px-3 py-2.5 text-left hover:border-line-strong hover:bg-surface-muted"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{e.title}</span>
                {e.meta && <span className="block truncate text-caption text-ink-3">{e.meta}</span>}
              </span>
              <span className="text-caption text-primary">Edit</span>
            </button>
          </li>
        ))}
        {entries.length === 0 && <li className="text-small text-ink-3">Nothing in this section yet.</li>}
      </ul>
      {addable && (
        <div>
          <Button
            size="sm"
            onClick={() => {
              const r = addItem(content, addable)
              onChange(r.content)
              onSelect(r.block)
            }}
          >
            + Add {section === 'skills' ? 'skill group' : 'entry'}
          </Button>
        </div>
      )}
    </div>
  )
}

function Field({
  field,
  large,
  onFocus,
  onChange,
  tools,
}: {
  field: FieldInfo
  large: boolean
  onFocus: () => void
  onChange: (value: string) => void
  tools: React.ReactNode
}) {
  const id = `f-${field.path.replace(/[^a-zA-Z0-9-]/g, '_')}`
  const cls = cx(
    'w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-ink focus:border-primary',
    large ? 'text-body' : 'text-small',
  )
  const multiline = field.multiline || (large && field.value.length > 50)
  return (
    <div data-field={field.path} className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-caption font-medium text-ink-2">
          {field.label}
        </label>
        {tools && <span className="flex gap-0.5">{tools}</span>}
      </div>
      {multiline ? (
        <textarea
          id={id}
          value={field.value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          rows={
            large
              ? Math.min(8, Math.max(3, Math.ceil(field.value.length / 55)))
              : Math.min(6, Math.max(2, Math.ceil(field.value.length / 70)))
          }
          className={cx(cls, 'resize-y leading-relaxed')}
        />
      ) : (
        <input
          id={id}
          value={field.value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          className={cx(cls, large ? 'h-11' : 'h-9')}
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
