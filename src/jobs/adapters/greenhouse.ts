import { worthDetail } from '../filters'
import { fetchJson, htmlToText, toDate } from '../http'
import type { Adapter, RawPosting } from '../types'

type ListJob = {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string }
  updated_at?: string
  first_published?: string
}
type DetailJob = ListJob & { content?: string }

const MAX_DETAILS = 60

/**
 * Greenhouse job board API. config: { board }
 * Lists every job without descriptions (small), then downloads the description only for jobs whose title and
 * location could pass the filters. Big boards (Stripe, Databricks…) would otherwise be several MB per search.
 */
export const greenhouse: Adapter = async ({ board }, name) => {
  const base = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`
  const { jobs } = await fetchJson<{ jobs: ListJob[] }>(base, { timeoutMs: 30000 })

  const postings: RawPosting[] = jobs.map((j) => ({
    externalId: String(j.id),
    company: name,
    title: j.title.trim(),
    location: j.location?.name?.trim() || 'Not stated',
    url: j.absolute_url,
    postedAt: toDate(j.first_published ?? j.updated_at),
  }))

  const wanted = postings.filter(worthDetail).slice(0, MAX_DETAILS)
  const queue = [...wanted]
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        try {
          const detail = await fetchJson<DetailJob>(`${base}/${p.externalId}`, { timeoutMs: 15000 })
          p.description = htmlToText(detail.content)
        } catch {
          // Keep the posting without a description; the filters treat it as "level not stated".
        }
      }
    }),
  )
  return postings
}
