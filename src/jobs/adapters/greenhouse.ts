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
 * Descriptions already downloaded in this server process, keyed by board, job id and last update, so repeat
 * searches (every few minutes while the app is open) only fetch what's new or changed.
 */
const detailCache = new Map<string, string | undefined>()
const CACHE_LIMIT = 20000
function remember(key: string, value: string | undefined) {
  if (detailCache.size >= CACHE_LIMIT) detailCache.delete(detailCache.keys().next().value!)
  detailCache.set(key, value)
}

/**
 * Greenhouse job board API. config: { board }
 * Lists every job without descriptions (small), then downloads the description only for jobs whose title and
 * location could pass the filters. Big boards (Stripe, Databricks…) would otherwise be several MB per search.
 */
export const greenhouse: Adapter = async ({ board }, name) => {
  const base = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`
  const { jobs } = await fetchJson<{ jobs: ListJob[] }>(base, { timeoutMs: 30000 })

  const updatedAt = new Map(jobs.map((j) => [String(j.id), j.updated_at ?? '']))
  const cacheKey = (id: string) => `${board}:${id}:${updatedAt.get(id)}`
  const postings: RawPosting[] = jobs.map((j) => ({
    externalId: String(j.id),
    company: name,
    title: j.title.trim(),
    location: j.location?.name?.trim() || 'Not stated',
    url: j.absolute_url,
    postedAt: toDate(j.first_published ?? j.updated_at),
  }))

  const wanted = postings.filter(worthDetail)
  for (const p of wanted) {
    const key = cacheKey(p.externalId)
    if (detailCache.has(key)) p.description = detailCache.get(key)
  }
  const queue = wanted.filter((p) => !detailCache.has(cacheKey(p.externalId))).slice(0, MAX_DETAILS)
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        try {
          const detail = await fetchJson<DetailJob>(`${base}/${p.externalId}`, { timeoutMs: 15000 })
          p.description = htmlToText(detail.content)
          remember(cacheKey(p.externalId), p.description)
        } catch {
          // Keep the posting without a description; the filters treat it as "level not stated".
        }
      }
    }),
  )
  return postings
}
