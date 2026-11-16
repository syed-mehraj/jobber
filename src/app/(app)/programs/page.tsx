import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { ExternalIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { platforms, programs, type Verdict } from '@/lib/programs'

export const metadata: Metadata = { title: 'Programs and other sites' }

const VERDICT: Record<Verdict, { text: string; tone: 'success' | 'primary' | 'warning' | 'danger' | 'neutral' }> = {
  check: { text: 'Check now', tone: 'success' },
  plan: { text: 'Plan for it', tone: 'primary' },
  conditional: { text: 'Depends on you', tone: 'warning' },
  'not-eligible': { text: 'Not eligible', tone: 'neutral' },
  avoid: { text: 'Skip', tone: 'danger' },
}

export default function ProgramsPage() {
  return (
    <>
      <PageHeader
        title="Programs and other sites"
        text="Places with real openings that can't be fetched automatically. Check these by hand."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader title="Programs and schemes" />
          <ul>
            {programs.map((p) => (
              <Item key={p.name} name={p.name} url={p.url} verdict={p.verdict}>
                <p>{p.what}</p>
                <p>
                  <b className="font-medium text-ink">For you:</b> {p.you}
                </p>
                <p>
                  <b className="font-medium text-ink">When:</b> {p.when}
                </p>
              </Item>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Sites to check by hand" />
          <ul>
            {platforms.map((p) => (
              <Item key={p.name} name={p.name} url={p.url} verdict={p.verdict} hideLink={p.verdict === 'avoid'}>
                <p>{p.why}</p>
                <p>
                  <b className="font-medium text-ink">How:</b> {p.how}
                </p>
              </Item>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-5 text-[12.5px] text-ink-3">
        From research in November 2026. Rules change; confirm eligibility on the official page before applying.
      </p>
    </>
  )
}

function Item({
  name,
  url,
  verdict,
  hideLink,
  children,
}: {
  name: string
  url: string
  verdict: Verdict
  hideLink?: boolean
  children: React.ReactNode
}) {
  const v = VERDICT[verdict]
  return (
    <li className="grid gap-2 border-b border-line px-4 py-4 last:border-b-0 sm:px-[22px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {hideLink ? (
          <span className="font-semibold">{name}</span>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold hover:text-primary [&_svg]:size-3.5 [&_svg]:text-ink-3"
          >
            {name}
            <ExternalIcon />
          </a>
        )}
        <Badge tone={v.tone}>{v.text}</Badge>
      </div>
      <div className="grid gap-1 text-small text-ink-2">{children}</div>
    </li>
  )
}
