import { fetchJson, htmlToText, toDate } from '../http'
import type { Adapter } from '../types'

type Search = { hits: { objectID: string; title: string; created_at: string }[] }
type Item = { id: number; created_at?: string; text?: string | null; children?: Item[] }

/**
 * The monthly Hacker News "Ask HN: Who is hiring?" thread, through the public Algolia API.
 * Each top-level comment is one company's post; the first line is usually "Company | Role | Location | …".
 */
export const hackernews: Adapter = async () => {
  const search = await fetchJson<Search>(
    'https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=6',
  )
  const thread = search.hits.find((h) => /who is hiring/i.test(h.title))
  if (!thread) return []
  const item = await fetchJson<Item>(`https://hn.algolia.com/api/v1/items/${thread.objectID}`, { timeoutMs: 45000 })
  return (item.children ?? [])
    .filter((c) => c.text)
    .map((c) => {
      const text = htmlToText(c.text, 3000) ?? ''
      const first = text.split('\n')[0] ?? ''
      const parts = first
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
      const company = (parts[0] ?? 'Unknown')
        .replace(/\(.*?\)/g, '')
        .trim()
        .slice(0, 60)
      const role =
        parts.slice(1).find((p) => /engineer|developer|intern|scientist|ml|ai|swe|sde|graduate/i.test(p)) ??
        parts[1] ??
        'See post'
      const location =
        parts
          .slice(1)
          .find((p) =>
            /remote|onsite|on-site|hybrid|india|bangalore|bengaluru|hyderabad|[A-Z][a-z]+, [A-Z]{2}/i.test(p),
          ) ?? 'See post'
      return {
        externalId: String(c.id),
        company,
        title: role.slice(0, 120),
        location: location.slice(0, 120),
        url: `https://news.ycombinator.com/item?id=${c.id}`,
        postedAt: toDate(c.created_at),
        description: text,
        remote: /remote/i.test(first),
      }
    })
}
