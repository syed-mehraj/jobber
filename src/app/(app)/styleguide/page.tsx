import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { Badge, ScoreBadge } from '@/components/ui/badge'
import { Button, iconButtonClass, type ButtonVariant } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { MenuIcon, PlusIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = { title: 'Style guide' }

const colours = [
  ['canvas', 'bg-canvas', '#EEF1F6'],
  ['surface', 'bg-surface', '#FFFFFF'],
  ['surface-muted', 'bg-surface-muted', '#F7F9FC'],
  ['sunken', 'bg-sunken', '#E5E9F0'],
  ['line', 'bg-line', '#E2E7EF'],
  ['line-strong', 'bg-line-strong', '#CBD3DF'],
  ['ink', 'bg-ink', '#0F172A'],
  ['ink-2', 'bg-ink-2', '#475569'],
  ['ink-3', 'bg-ink-3', '#8391A7'],
  ['primary', 'bg-primary', '#2563EB'],
  ['primary-hover', 'bg-primary-hover', '#1D4ED8'],
  ['primary-tint', 'bg-primary-tint', '#EAF1FF'],
  ['success', 'bg-success', '#15803D'],
  ['warning', 'bg-warning', '#B45309'],
  ['danger', 'bg-danger', '#DC2626'],
] as const

const variants: { v: ButtonVariant; label: string; use: string }[] = [
  { v: 'primary', label: 'Save', use: 'The one main action per view' },
  { v: 'secondary', label: 'Duplicate', use: 'Everything else' },
  { v: 'subtle', label: 'Tailor to job ✦', use: 'AI actions' },
  { v: 'ghost', label: 'Edit', use: 'Toolbars and row actions' },
  { v: 'danger', label: 'Delete', use: 'Only inside a confirm dialog' },
  { v: 'link', label: 'See all', use: 'Inline navigation' },
]

export default function StyleguidePage() {
  // A design tool for local development only; the live site doesn't have it.
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <>
      <PageHeader title="Style guide" text="Every token and component from docs/DESIGN.md, in code." />

      <div className="grid gap-6">
        <Section title="Colour">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {colours.map(([name, cls, hex]) => (
              <div key={name} className="overflow-hidden rounded-control border border-line">
                <div className={`h-12 ${cls}`} />
                <div className="px-2.5 py-2">
                  <p className="text-small font-medium">{name}</p>
                  <p className="text-caption text-ink-3">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="grid gap-2">
            <p className="text-page font-semibold tracking-[-0.02em]">Page title 28/36</p>
            <p className="text-title font-semibold">Card title 17/24</p>
            <p className="text-large">Large body 16/24</p>
            <p>Body 15/22: the quick brown fox applies to forty product companies.</p>
            <p className="text-small text-ink-2">Small 13/18 for labels and meta lines</p>
            <p className="text-caption text-ink-3">Caption 12/16 for hints and timestamps</p>
            <p className="text-stat font-semibold tracking-[-0.02em] text-primary">24</p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="grid gap-4">
            {variants.map(({ v, label, use }) => (
              <div key={v} className="flex flex-wrap items-center gap-3">
                <span className="w-24 text-small font-medium text-ink-2 capitalize">{v}</span>
                <Button variant={v} size="sm">
                  {label}
                </Button>
                <Button variant={v}>{label}</Button>
                <Button variant={v} size="lg">
                  {label}
                </Button>
                <Button variant={v} disabled>
                  Disabled
                </Button>
                <span className="text-small text-ink-3">{use}</span>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-small font-medium text-ink-2">States</span>
              <Button variant="primary">
                <PlusIcon />
                With icon
              </Button>
              <Button variant="primary" loading>
                Saving
              </Button>
              <button type="button" className={iconButtonClass({ size: 'sm' })} aria-label="Menu (small)">
                <MenuIcon />
              </button>
              <button type="button" className={iconButtonClass()} aria-label="Menu">
                <MenuIcon />
              </button>
              <span className="text-small text-ink-3">Tab to any button to see the focus ring.</span>
            </div>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <ScoreBadge score={92} />
            <ScoreBadge score={71} />
            <ScoreBadge score={48} />
            <ScoreBadge score={22} />
            <Badge>Saved</Badge>
            <Badge tone="primary">Applied</Badge>
            <Badge tone="warning">OA</Badge>
            <Badge tone="primary">Interview</Badge>
            <Badge tone="success">Offer</Badge>
            <Badge tone="danger">Rejected</Badge>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <Input label="Role" placeholder="Software Engineer Intern" hint="As it appears on the posting." />
            <Input label="Company" defaultValue="Atlassian" />
            <Input label="Graduation year" defaultValue="20" error="Use four digits, for example 2027." />
            <Input label="Disabled" defaultValue="Read only" disabled />
          </div>
        </Section>

        <Section title="Loading">
          <div className="grid gap-3">
            <Skeleton className="h-8 w-56" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-14" />
          </div>
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="p-4 sm:p-[22px]">{children}</div>
    </Card>
  )
}
