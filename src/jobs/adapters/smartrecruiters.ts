import { fetchJson, toDate } from '../http'
import type { Adapter, RawPosting } from '../types'

type Response = {
  totalFound: number
  content: {
    id: string
    name: string
    releasedDate?: string
    location?: { city?: string; country?: string; remote?: boolean; fullLocation?: string }
    experienceLevel?: { label?: string }
    typeOfEmployment?: { label?: string }
  }[]
}

/** SmartRecruiters public postings API. config: { company, country? } (country "in" limits to India). */
export const smartrecruiters: Adapter = async ({ company, country }, name) => {
  const out: RawPosting[] = []
  for (let offset = 0; offset < 1000; offset += 100) {
    const q = new URLSearchParams({ limit: '100', offset: String(offset) })
    if (country) q.set('country', country)
    const data = await fetchJson<Response>(`https://api.smartrecruiters.com/v1/companies/${company}/postings?${q}`)
    for (const p of data.content) {
      out.push({
        externalId: p.id,
        company: name,
        title: p.name.trim(),
        location:
          p.location?.fullLocation ??
          ([p.location?.city, p.location?.country].filter(Boolean).join(', ') || 'Not stated'),
        url: `https://jobs.smartrecruiters.com/${company}/${p.id}`,
        postedAt: toDate(p.releasedDate),
        remote: p.location?.remote,
        hints: { level: p.experienceLevel?.label, employmentType: p.typeOfEmployment?.label },
      })
    }
    if (offset + 100 >= data.totalFound) break
  }
  return out
}
