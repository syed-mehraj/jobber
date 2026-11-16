import { fetchJson, toDate } from '../http'
import type { Adapter } from '../types'

type Response = {
  jobs: {
    id: string
    title: string
    location?: string
    secondaryLocations?: { location?: string }[]
    isRemote?: boolean
    isListed?: boolean
    publishedAt?: string
    jobUrl: string
    descriptionPlain?: string
    employmentType?: string
  }[]
}

/** Ashby posting API. config: { board } */
export const ashby: Adapter = async ({ board }, name) => {
  const data = await fetchJson<Response>(`https://api.ashbyhq.com/posting-api/job-board/${board}`, {
    timeoutMs: 30000,
  })
  return data.jobs
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      externalId: j.id,
      company: name,
      title: j.title.trim(),
      location:
        [j.location, ...(j.secondaryLocations ?? []).map((s) => s.location)].filter(Boolean).join('; ') || 'Not stated',
      url: j.jobUrl,
      postedAt: toDate(j.publishedAt),
      description: j.descriptionPlain?.slice(0, 4000),
      remote: j.isRemote,
      hints: { employmentType: j.employmentType },
    }))
}
