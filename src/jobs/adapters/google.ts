import { htmlToText, toDate } from '../http'
import type { Adapter, RawPosting } from '../types'

/*
 * UNOFFICIAL: Google Careers has no published API. Its results page embeds the jobs as data
 * (AF_initDataCallback "ds:1"); this reads that. It can change at any time; the runner reads it at most
 * once an hour. Only early-career and intern listings in India are requested.
 */

const BASE = 'https://www.google.com/about/careers/applications/jobs/results'

/** Pulls the embedded job data out of a results page. Exported for tests. */
export function parseGoogleResults(html: string): { jobs: unknown[][]; total: number } {
  const m = html.match(/AF_initDataCallback\(\{key: 'ds:1'[\s\S]*?data:(\[[\s\S]*?\]), sideChannel/)
  if (!m) throw new Error('Google Careers page format changed')
  const data = JSON.parse(m[1]) as [unknown[][] | null, unknown, number, number]
  return { jobs: data[0] ?? [], total: Number(data[3]) || 0 }
}

const html = (v: unknown) => (Array.isArray(v) && typeof v[1] === 'string' ? v[1] : '')

export const google: Adapter = async () => {
  const seen = new Map<string, RawPosting>()
  for (const filter of ['target_level=EARLY', 'employment_type=INTERN']) {
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`${BASE}?location=India&${filter}&page=${page}`, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; JobberPersonalSearch/0.1)' },
        signal: AbortSignal.timeout(30000),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} from google.com`)
      const { jobs, total } = parseGoogleResults(await res.text())
      for (const j of jobs) {
        const id = String(j[0])
        if (seen.has(id)) continue
        const locations = Array.isArray(j[9]) ? (j[9] as unknown[][]).map((l) => String(l[0])) : []
        const posted = Array.isArray(j[12]) ? Number((j[12] as number[])[0]) : undefined
        seen.set(id, {
          externalId: id,
          company: 'Google',
          title: String(j[1]).trim(),
          location: locations.join('; ') || 'India',
          url: `${BASE}/${id}`,
          postedAt: toDate(posted),
          description: htmlToText([html(j[4]), html(j[19]), html(j[3]), html(j[10])].join('<br/>')),
          hints: { level: filter.includes('INTERN') ? 'Internship' : 'Entry level' },
        })
      }
      if (page * 10 >= total) break
    }
  }
  return [...seen.values()]
}
