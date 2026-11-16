import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getSources } from '@/lib/data'
import { timeAgo } from '@/lib/format'
import { isUnofficial } from '@/jobs/unofficial'

export const metadata: Metadata = { title: 'Companies and sources' }

const KIND: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  smartrecruiters: 'SmartRecruiters',
  simplify: 'GitHub list',
  hackernews: 'Hacker News',
  amazon: 'Careers site',
  eightfold: 'Careers site (Eightfold)',
  google: 'Careers site',
}

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        title="Companies and sources"
        text="Every place the search reads, how many postings it had, and how many passed your filters."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <SourceList />
      </Suspense>
      <p className="mt-4 text-small text-ink-3">
        Official boards are in <code>src/jobs/catalog.ts</code>; the unofficial big-tech careers sites, read at most
        once an hour, are in <code>src/jobs/catalog-unofficial.ts</code>. Everything else is on the Programs page.
      </p>
    </>
  )
}

async function SourceList() {
  const rows = await getSources()
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-small">
        <thead className="bg-surface-muted text-ink-2">
          <tr>
            <th className="px-4 py-2.5 font-medium sm:pl-[22px]">Source</th>
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 text-right font-medium">Postings</th>
            <th className="px-4 py-2.5 text-right font-medium">Kept</th>
            <th className="px-4 py-2.5 font-medium sm:pr-[22px]">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-line">
              <td className="px-4 py-2.5 font-medium sm:pl-[22px]">{s.name}</td>
              <td className="px-4 py-2.5 text-ink-2">
                {KIND[s.kind] ?? s.kind}
                {isUnofficial(s.kind) && (
                  <span className="ml-1.5" title="No published feed; read at most once an hour">
                    <Badge tone="warning">Unofficial</Badge>
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">{s.lastSeen}</td>
              <td className="px-4 py-2.5 text-right font-medium">{s.lastKept}</td>
              <td className="px-4 py-2.5 sm:pr-[22px]">
                {s.lastError ? (
                  <span title={s.lastError}>
                    <Badge tone="danger">Failing</Badge>
                  </span>
                ) : s.lastSuccessAt ? (
                  <span className="text-ink-3">OK · {timeAgo(s.lastSuccessAt)}</span>
                ) : (
                  <span className="text-ink-3">Not run yet</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
