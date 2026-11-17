'use client'

import { TemplateThumb } from '@/components/resume/template-thumb'
import { Card } from '@/components/ui/card'
import { cx } from '@/lib/cx'
import { FONTS, TEMPLATES, type FontId, type ResumeDesign, type TemplateId } from '@/resume/design'
import type { ResumeContent } from '@/resume/types'

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
        <h2 className="text-small font-semibold">{title}</h2>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </Card>
  )
}

/** Fonts, as a grid of "Aa" tiles in each font. */
export function FontPanel({ value, onChange }: { value: FontId; onChange: (f: FontId) => void }) {
  return (
    <Panel title="Fonts">
      <div role="radiogroup" aria-label="Font" className="grid grid-cols-3 gap-2">
        {FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={value === f.id}
            onClick={() => onChange(f.id)}
            title={f.description}
            className={cx(
              'grid gap-0.5 rounded-control border px-2 py-2.5 text-center transition-colors',
              value === f.id ? 'border-primary bg-primary-tint/60' : 'border-line hover:border-line-strong',
            )}
          >
            <span className="text-[22px] leading-7" style={{ fontFamily: `var(${f.cssVar}), system-ui, serif` }}>
              Aa
            </span>
            <span className="truncate text-caption text-ink-2">{f.label}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}

/** Resume styles, as small live thumbnails of this resume in each template. */
export function StylePanel({
  content,
  design,
  onChange,
  onAccent,
}: {
  content: ResumeContent
  design: ResumeDesign
  onChange: (t: TemplateId) => void
  onAccent: (a: ResumeDesign['accent']) => void
}) {
  return (
    <Panel
      title="Resume style"
      action={
        <span className="flex items-center gap-1.5 text-caption text-ink-3">
          Accent
          {(['blue', 'black'] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-label={`${a} accent`}
              aria-pressed={design.accent === a}
              onClick={() => onAccent(a)}
              className={cx(
                'size-5 rounded-full border-2',
                a === 'blue' ? 'bg-primary' : 'bg-ink',
                design.accent === a ? 'border-surface ring-2 ring-primary' : 'border-surface ring-1 ring-line-strong',
              )}
            />
          ))}
        </span>
      }
    >
      <div role="radiogroup" aria-label="Resume style" className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={design.template === t.id}
            onClick={() => onChange(t.id)}
            title={t.description}
            className={cx(
              'grid justify-items-center gap-1.5 rounded-control border p-2 transition-colors',
              design.template === t.id ? 'border-primary bg-primary-tint/60' : 'border-line hover:border-line-strong',
            )}
          >
            <span className="pointer-events-none block h-[96px] overflow-hidden rounded-[3px] border border-line bg-white">
              <TemplateThumb content={content} design={{ ...design, template: t.id }} />
            </span>
            <span className="text-caption text-ink-2">{t.label}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}
