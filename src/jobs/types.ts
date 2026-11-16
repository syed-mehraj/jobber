/** A posting as a source reports it, before filtering. */
export type RawPosting = {
  externalId: string
  company: string
  title: string
  location: string
  url: string
  postedAt?: Date
  /** Plain text, when the source includes it. */
  description?: string
  remote?: boolean
  /** Hints a source gives directly, e.g. SmartRecruiters' experience level or Simplify's sponsorship field. */
  hints?: { level?: string; sponsorship?: string; employmentType?: string; strictLevel?: boolean }
}

export type SourceConfig = Record<string, string>

export type Adapter = (config: SourceConfig, name: string) => Promise<RawPosting[]>
