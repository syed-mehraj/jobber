import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { COUNTRY_FLAGS, type CountryCode } from '@/jobs/countries'
import { countryGuide, guideAsOf, type CountryInfo, type Realism } from '@/lib/countries-guide'

const tone = (r: Realism): 'success' | 'warning' | 'danger' =>
  r.startsWith('High') || r.startsWith('Medium-High') ? 'success' : r.startsWith('Medium') ? 'warning' : 'danger'
const flag = (code: string) => COUNTRY_FLAGS[code as CountryCode] ?? '🌍'

/** At the top of the Abroad tab: an overview of countries, or the details for the chosen one. */
export function CountryGuide({ country }: { country: string }) {
  if (!countryGuide.length) return null
  const one = countryGuide.find((c) => c.code === country)
  return one ? <CountryCard c={one} /> : <Overview />
}

function Overview() {
  const list = [...countryGuide].sort((a, b) => a.rank - b.rank)
  return (
    <Card className="mb-4 overflow-hidden">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-title font-semibold">Where to aim, for a 2027 graduate from India</span>
            <span className="block text-caption text-ink-3">
              Ranked by how realistic the visa is, pay, safety and friendliness
              {guideAsOf ? ` · as of ${guideAsOf}` : ''}. Pick a country below for details.
            </span>
          </span>
          <span className="text-small text-ink-3 group-open:hidden">Show</span>
          <span className="hidden text-small text-ink-3 group-open:inline">Hide</span>
        </summary>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[760px] text-left text-small">
            <thead className="bg-surface-muted text-ink-2">
              <tr>
                <th className="px-4 py-2 font-medium sm:pl-5">#</th>
                <th className="px-3 py-2 font-medium">Country</th>
                <th className="px-3 py-2 font-medium">Visa for you</th>
                <th className="px-3 py-2 font-medium">Junior pay</th>
                <th className="px-3 py-2 font-medium">Safety</th>
                <th className="px-3 py-2 font-medium">Competition</th>
                <th className="px-3 py-2 font-medium sm:pr-5">In one line</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.code} className="border-t border-line align-top">
                  <td className="px-4 py-2.5 text-ink-3 tabular-nums sm:pl-5">{c.rank}</td>
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                    {flag(c.code)} {c.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={tone(c.visaRealism)}>{c.visaRealism}</Badge>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.juniorPay}
                    <span className="block text-caption text-ink-3">{c.juniorPayInr}</span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">{c.safety}</td>
                  <td className="px-3 py-2.5 text-ink-2">{c.competition}</td>
                  <td className="px-3 py-2.5 text-ink-2 sm:pr-5">{c.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  )
}

function CountryCard({ c }: { c: CountryInfo }) {
  const rows: [string, string][] = [
    ['Visa route', c.visa],
    ['Junior pay', `${c.juniorPay} (${c.juniorPayInr})`],
    ['Tax', c.tax],
    ['Safety', c.safety],
    ['Friendliness', c.friendliness],
    ['Competition', c.competition],
    ['Language', c.english],
    ['Life there', c.nature],
  ]
  return (
    <Card className="mb-4 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-title font-semibold">
          {flag(c.code)} {c.name}
        </h2>
        <Badge tone={tone(c.visaRealism)}>Visa: {c.visaRealism}</Badge>
        <span className="text-caption text-ink-3">#{c.rank} for you</span>
      </div>
      <p className="mt-1 text-ink-2">{c.verdict}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-small sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-caption font-medium text-ink-3">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {c.companies.length > 0 && (
        <p className="mt-3 text-small text-ink-2">
          <span className="font-medium text-ink">Known to sponsor or relocate:</span>{' '}
          {c.companies.map((x) => `${x.name} (${x.city})`).join(', ')}
        </p>
      )}
      {c.sources.length > 0 && (
        <p className="mt-2 text-caption text-ink-3">
          Sources:{' '}
          {c.sources.slice(0, 5).map((u, i) => (
            <a
              key={u}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              {i ? ', ' : ''}
              {new URL(u).host.replace(/^www\./, '')}
            </a>
          ))}
        </p>
      )}
    </Card>
  )
}
