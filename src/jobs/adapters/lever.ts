import { fetchJson, toDate } from '../http'
import type { Adapter } from '../types'

type Posting = {
  id: string
  text: string
  hostedUrl: string
  createdAt?: number
  descriptionPlain?: string
  additionalPlain?: string
  lists?: { text: string; content: string }[]
  workplaceType?: string
  categories?: { location?: string; allLocations?: string[]; commitment?: string }
}

/** Lever postings API. config: { site, region?: "eu" } */
export const lever: Adapter = async ({ site, region }, name) => {
  const host = region === 'eu' ? 'api.eu.lever.co' : 'api.lever.co'
  const data = await fetchJson<Posting[]>(`https://${host}/v0/postings/${site}?mode=json`, { timeoutMs: 30000 })
  return data.map((p) => {
    const locations = p.categories?.allLocations?.length ? p.categories.allLocations : [p.categories?.location ?? '']
    const lists = (p.lists ?? []).map((l) => `${l.text}\n${l.content.replace(/<[^>]+>/g, ' ')}`).join('\n')
    return {
      externalId: p.id,
      company: name,
      title: p.text.trim(),
      location: locations.filter(Boolean).join('; ') || 'Not stated',
      url: p.hostedUrl,
      postedAt: toDate(p.createdAt),
      description: [p.descriptionPlain, lists, p.additionalPlain].filter(Boolean).join('\n').slice(0, 4000),
      remote: p.workplaceType === 'remote',
      hints: { employmentType: p.categories?.commitment },
    }
  })
}
