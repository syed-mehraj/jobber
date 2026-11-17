import { countryOf } from '../countries'
import { fetchJson, htmlToText, toDate } from '../http'
import type { Adapter, RawPosting } from '../types'

/*
 * Arbeitnow's free, documented job board API (jobs in Germany and Europe, updated hourly):
 * https://www.arbeitnow.com/blog/job-board-api. With visa_sponsorship=true it lists only jobs whose employer
 * offers visa sponsorship. Its terms ask users not to abuse it and to link back: every job's link opens the
 * listing on arbeitnow.com. Read at most 2 pages per search.
 */

type Job = {
  slug: string
  company_name: string
  title: string
  description?: string
  remote?: boolean
  url: string
  location?: string
  job_types?: string[]
  created_at?: number
}

export const arbeitnow: Adapter = async () => {
  const out: RawPosting[] = []
  for (let page = 1; page <= 2; page++) {
    const res = await fetchJson<{ data: Job[]; links?: { next?: string | null } }>(
      `https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true&page=${page}`,
      { timeoutMs: 30000 },
    )
    for (const j of res.data) {
      out.push({
        externalId: j.slug,
        company: j.company_name.trim(),
        title: j.title.trim(),
        // Most listings are in Germany; only add the country when the location doesn't already name one.
        location: !j.location ? 'Germany' : countryOf(j.location) ? j.location : `${j.location}, Germany`,
        url: j.url,
        postedAt: toDate(j.created_at),
        description: htmlToText(j.description),
        remote: j.remote === true,
        hints: {
          sponsorship: 'Offers Sponsorship',
          employmentType: (j.job_types ?? []).join(', '),
        },
      })
    }
    if (!res.links?.next) break
  }
  return out
}
