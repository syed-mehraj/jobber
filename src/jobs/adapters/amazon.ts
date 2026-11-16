import { fetchJson, htmlToText, toDate } from '../http'
import type { Adapter, RawPosting } from '../types'

/*
 * UNOFFICIAL: amazon.jobs has no published API. This reads the JSON its own search page loads.
 * It can change or be blocked at any time; the runner reads it at most once an hour.
 */

type Job = {
  id_icims: string
  title: string
  normalized_location?: string
  job_path: string
  posted_date?: string
  description?: string
  basic_qualifications?: string
  preferred_qualifications?: string
  is_intern?: boolean
  university_job?: boolean
  is_manager?: boolean
}

/** config: { terms? } comma-separated searches; India only. */
export const amazon: Adapter = async ({ terms }) => {
  const searches = (terms ?? 'software development engineer,machine learning,data engineer,intern,university').split(
    ',',
  )
  const seen = new Map<string, RawPosting>()
  for (const term of searches) {
    for (let offset = 0; offset < 300; offset += 100) {
      const q = new URLSearchParams({
        base_query: term.trim(),
        result_limit: '100',
        offset: String(offset),
        sort: 'recent',
      })
      q.append('normalized_country_code[]', 'IND')
      const data = await fetchJson<{ hits: number; jobs: Job[] }>(`https://www.amazon.jobs/en/search.json?${q}`)
      for (const j of data.jobs) {
        if (seen.has(j.id_icims) || j.is_manager) continue
        seen.set(j.id_icims, {
          externalId: j.id_icims,
          company: 'Amazon',
          title: j.title.trim(),
          location: j.normalized_location ?? 'India',
          url: `https://www.amazon.jobs${j.job_path}`,
          postedAt: toDate(j.posted_date),
          description: htmlToText(
            [j.basic_qualifications, j.preferred_qualifications, j.description].filter(Boolean).join('<br/>'),
          ),
          hints: { level: j.is_intern ? 'Internship' : j.university_job ? 'New grad' : undefined },
        })
      }
      if (offset + 100 >= data.hits) break
    }
  }
  return [...seen.values()]
}
