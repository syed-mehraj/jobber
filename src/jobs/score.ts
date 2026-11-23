import type { Level, Region } from '@/db/schema'
import { canonicalSkill, extractSkills } from './skills'
import type { RawPosting } from './types'

/*
 * Keyword-based match score (0–99) until Gemini scoring is connected (Phase 5).
 * It rewards what makes an offer realistic: the right level, a category that fits the work already done,
 * skills that appear in the posting, a reachable location, and freshness (early applicants get read).
 */

export type Profile = { skills: string[]; preferred: string[] }

/** Skills from real work (the voice agent, NestJS services, the Expo/Kotlin app, the ML projects). Editable later. */
export const defaultProfile: Profile = {
  skills: [
    'python',
    'typescript',
    'javascript',
    'react',
    'next.js',
    'node',
    'nestjs',
    'sql',
    'postgres',
    'docker',
    'pytorch',
    'tensorflow',
    'scikit-learn',
    'machine learning',
    'deep learning',
    'llm',
    'rag',
    'nlp',
    'generative ai',
    'voice',
    'speech',
    'kotlin',
    'android',
    'react native',
    'expo',
    'microservices',
    'rest',
    'git',
  ],
  preferred: ['ML / AI', 'Backend', 'SDE', 'Full-stack'],
}

const LEVEL_POINTS: Record<Level, number> = { 'new-grad': 32, intern: 30, entry: 28, unspecified: 14 }
const REGION_POINTS: Record<Region, number> = { hyderabad: 15, india: 12, remote: 12, international: 6 }
const LEVEL_TEXT: Record<Level, string> = {
  'new-grad': 'New-grad role',
  intern: 'Internship',
  entry: 'Asks for 0–1 years',
  unspecified: 'Level not stated',
}
const REGION_TEXT: Record<Region, string> = {
  hyderabad: 'In Hyderabad',
  india: 'In India',
  remote: 'Remote',
  international: 'Abroad, with sponsorship',
}

/** Postings that list at least this many known skills are scored by how many of them the profile covers. */
const COVERAGE_MIN_SKILLS = 3
const SKILL_POINTS = 30

/** What scoring needs from a job; both a fresh posting and a stored job row provide it. */
export type ScoreInput = {
  level: Level
  region: Region
  category: string
  /** Canonical skills the posting asks for (extractSkills of title + full description). */
  required: string[]
  /** False when the posting had no description to check. */
  hasDescription: boolean
  postedAt: Date | null | undefined
}

export type Scored = { score: number; matched: string[]; missing: string[]; reasons: string[] }

/** The score of one job for one profile. Used by the search and by per-person rescoring. */
export function scoreFor(job: ScoreInput, profile: Profile, now = new Date()): Scored {
  const have = new Set(profile.skills.map(canonicalSkill))
  const matched = job.required.filter((s) => have.has(s))
  const missing = job.required.filter((s) => !have.has(s))
  const reasons = [LEVEL_TEXT[job.level], REGION_TEXT[job.region]]

  let score = LEVEL_POINTS[job.level] + REGION_POINTS[job.region]
  score += profile.preferred.includes(job.category) ? 14 : 8

  if (!job.hasDescription)
    score += 10 // no description to check; give a neutral share
  else if (job.required.length >= COVERAGE_MIN_SKILLS) score += (matched.length / job.required.length) * SKILL_POINTS
  else score += Math.min(SKILL_POINTS, matched.length * 6)
  if (matched.length) reasons.push(`Mentions ${matched.slice(0, 4).join(', ')}`)

  if (job.postedAt) {
    const days = (now.getTime() - job.postedAt.getTime()) / 86400000
    if (days <= 2) {
      score += 8
      reasons.push('Posted in the last 2 days')
    } else if (days <= 7) score += 5
    else if (days <= 14) score += 2
  }
  return { score: Math.max(0, Math.min(99, Math.round(score))), matched, missing, reasons }
}

export function scoreJob(
  p: RawPosting,
  c: { level: Level; region: Region; category: string },
  profile: Profile = defaultProfile,
  now = new Date(),
): Scored & { required: string[] } {
  const required = extractSkills(`${p.title}\n${p.description ?? ''}`)
  return {
    ...scoreFor({ ...c, required, hasDescription: Boolean(p.description), postedAt: p.postedAt }, profile, now),
    required,
  }
}
