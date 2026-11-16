import type { Adapter } from '../types'
import { amazon } from './amazon'
import { ashby } from './ashby'
import { eightfold } from './eightfold'
import { google } from './google'
import { greenhouse } from './greenhouse'
import { hackernews } from './hackernews'
import { lever } from './lever'
import { simplify } from './simplify'
import { smartrecruiters } from './smartrecruiters'

/**
 * Official sources have a published, public feed: the Greenhouse, Lever, Ashby and SmartRecruiters job-board APIs,
 * the Hacker News Algolia API, and the SimplifyJobs lists on GitHub. Sites whose terms forbid automated access
 * (LinkedIn, Wellfound, Instahyre…) are linked on the Programs page instead.
 *
 * Unofficial sources (UNOFFICIAL_KINDS) read the data big-tech careers sites load for their own pages. The owner
 * chose to include them for personal use; they are marked in the UI and read at most once an hour.
 */
export { UNOFFICIAL_KINDS } from '../unofficial'

export const adapters: Record<string, Adapter> = {
  greenhouse,
  lever,
  ashby,
  smartrecruiters,
  simplify,
  hackernews,
  amazon,
  eightfold,
  google,
}
