import { fetchJson, toDate } from '../http'
import type { Adapter } from '../types'

type Listing = {
  id: string
  company_name: string
  title: string
  url: string
  locations: string[]
  date_posted?: number
  active?: boolean
  is_visible?: boolean
  sponsorship?: string
  terms?: string[]
}

/**
 * Community-maintained GitHub job lists in the SimplifyJobs format, updated many times a day.
 * config: { owner = "SimplifyJobs", repo, kind: "intern" | "new-grad" }.
 */
export const simplify: Adapter = async ({ owner = 'SimplifyJobs', repo, kind }) => {
  const data = await fetchJson<Listing[]>(
    `https://raw.githubusercontent.com/${owner}/${repo}/dev/.github/scripts/listings.json`,
    { timeoutMs: 90000 },
  )
  const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000
  return data
    .filter((l) => l.active && l.is_visible !== false && (l.date_posted ?? 0) * 1000 > cutoff)
    .map((l) => ({
      externalId: l.id,
      company: l.company_name,
      title: kind === 'intern' && !/intern|co-?op/i.test(l.title) ? `${l.title} (Intern)` : l.title,
      location: l.locations.join('; ') || 'Not stated',
      url: l.url,
      postedAt: toDate(l.date_posted),
      hints: { sponsorship: l.sponsorship, level: kind === 'intern' ? 'Internship' : 'New grad' },
    }))
}
