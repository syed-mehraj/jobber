import type { Adapter } from '../types'
import { ashby } from './ashby'
import { greenhouse } from './greenhouse'
import { hackernews } from './hackernews'
import { lever } from './lever'
import { simplify } from './simplify'
import { smartrecruiters } from './smartrecruiters'

/**
 * Only sources with a published, public feed: the Greenhouse, Lever, Ashby and SmartRecruiters job-board APIs,
 * the Hacker News Algolia API, and the SimplifyJobs lists on GitHub. Sites whose terms forbid automated access
 * (LinkedIn, Wellfound, Instahyre…) or that only have internal APIs are linked on the Programs page instead.
 */
export const adapters: Record<string, Adapter> = {
  greenhouse,
  lever,
  ashby,
  smartrecruiters,
  simplify,
  hackernews,
}
