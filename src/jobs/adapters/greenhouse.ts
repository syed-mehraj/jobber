import { fetchJson, htmlToText, toDate } from '../http'
import type { Adapter } from '../types'

type Response = {
  jobs: {
    id: number
    title: string
    absolute_url: string
    location?: { name?: string }
    updated_at?: string
    first_published?: string
    content?: string
  }[]
}

/** Greenhouse job board API. config: { token } */
export const greenhouse: Adapter = async ({ token }, name) => {
  const data = await fetchJson<Response>(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
    timeoutMs: 30000,
  })
  return data.jobs.map((j) => ({
    externalId: String(j.id),
    company: name,
    title: j.title.trim(),
    location: j.location?.name?.trim() || 'Not stated',
    url: j.absolute_url,
    postedAt: toDate(j.first_published ?? j.updated_at),
    description: htmlToText(j.content),
  }))
}
