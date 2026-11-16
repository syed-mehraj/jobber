import { fetchJson, htmlToText, toDate } from '../http'
import type { Adapter, RawPosting } from '../types'

/*
 * UNOFFICIAL: Eightfold career sites (Microsoft, Netflix…) have no published API. This reads the JSON their
 * own search pages load. It can change or be blocked at any time; the runner reads it at most once an hour.
 *
 * config: { host, domain, company, flavor: 'pcsx' | 'v2', terms?, location? }
 *  - pcsx (Microsoft): GET /api/pcsx/search, 10 results per page, no description in the list
 *  - v2 (Netflix):     GET /api/apply/v2/jobs, includes the description
 */

type PcsxPosition = { id: number; name: string; locations?: string[]; postedTs?: number; positionUrl?: string }
type V2Position = {
  id: number
  name: string
  location?: string
  locations?: string[]
  t_create?: number
  canonicalPositionUrl?: string
  job_description?: string
}

export const eightfold: Adapter = async ({ host, domain, company, flavor, terms, location = 'India' }) => {
  const seen = new Map<string, RawPosting>()
  if (flavor === 'pcsx') {
    // Microsoft rate-limits quick bursts (HTTP 429), so keep it small and spaced out: about 9 requests an hour.
    const searches = (terms ?? 'software engineer,machine learning,intern').split(',')
    let requests = 0
    for (const term of searches) {
      for (let start = 0; start < 30; start += 10) {
        if (requests++ > 0) await new Promise((r) => setTimeout(r, 1500))
        const q = new URLSearchParams({ domain, query: term.trim(), location, start: String(start) })
        const res = await fetchJson<{ data: { positions: PcsxPosition[]; count: number } }>(
          `https://${host}/api/pcsx/search?${q}`,
        )
        for (const p of res.data.positions) {
          const id = String(p.id)
          if (seen.has(id)) continue
          seen.set(id, {
            externalId: id,
            company,
            title: p.name.trim(),
            location: (p.locations ?? []).join('; ') || location,
            url: `https://${host}${p.positionUrl ?? `/careers/job/${id}`}`,
            postedAt: toDate(p.postedTs),
          })
        }
        if (start + 10 >= res.data.count) break
      }
    }
  } else {
    for (let start = 0; start < 300; start += 50) {
      const q = new URLSearchParams({ domain, location, start: String(start), num: '50' })
      const res = await fetchJson<{ positions: V2Position[]; count: number }>(`https://${host}/api/apply/v2/jobs?${q}`)
      for (const p of res.positions) {
        const id = String(p.id)
        seen.set(id, {
          externalId: id,
          company,
          title: p.name.trim(),
          location: (p.locations ?? [p.location ?? '']).join('; ') || location,
          url: p.canonicalPositionUrl ?? `https://${host}/careers/job/${id}`,
          postedAt: toDate(p.t_create),
          description: htmlToText(p.job_description),
        })
      }
      if (start + 50 >= res.count) break
    }
  }
  return [...seen.values()]
}
