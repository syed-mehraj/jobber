import { and, eq, isNull, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { abouts, jobMatches, jobs, profiles, resumes, users } from '@/db/schema'
import { defaultProfile, scoreFor, type Profile } from './score'
import { canonicalSkill, extractSkills } from './skills'

/** Every string inside a resume's JSON content, joined: summary, bullets, skills, project stacks… */
export function resumeText(content: unknown): string {
  const out: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') {
      if (v !== 'TODO' && !v.startsWith('TODO')) out.push(v)
    } else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(content)
  return out.join('\n')
}

/**
 * The skills one person's matches are scored against: their stored profile plus every known skill that appears
 * in their master resume or their "About you", so work described in prose counts as much as the Skills section.
 */
export async function loadProfile(db: DB, userId: string): Promise<Profile> {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId))
  const profile: Profile = row
    ? { skills: row.skills, preferred: row.preferred }
    : { skills: [], preferred: defaultProfile.preferred }
  const [master] = await db
    .select({ content: resumes.content })
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.isMaster, true)))
    .limit(1)
  const aboutText = (await db.select({ text: abouts.text }).from(abouts).where(eq(abouts.userId, userId)))
    .map((a) => a.text)
    .join('\n\n')
  const skills = new Set(profile.skills.map(canonicalSkill))
  // Skills named in "About you" count too, except ones it explicitly says you haven't used.
  const notUsed = extractSkills(
    [...aboutText.matchAll(/haven.t (directly )?(used|administered|worked with)[^.]*/gi)].map((m) => m[0]).join(' '),
  )
  const aboutSkills = extractSkills(aboutText).filter((s) => !notUsed.includes(s))
  for (const s of [...extractSkills(resumeText(master?.content)), ...aboutSkills]) skills.add(s)
  return { ...profile, skills: [...skills] }
}

/**
 * Scores every open job for each person (all of them, or the ones given) and stores the result in job_matches.
 * A dismissal survives: only the score and skill lists are rewritten.
 */
export async function rescore(db: DB, options: { userIds?: string[]; now?: Date } = {}): Promise<number> {
  const now = options.now ?? new Date()
  const people = options.userIds ? options.userIds : (await db.select({ id: users.id }).from(users)).map((u) => u.id)
  if (!people.length) return 0

  const open = await db
    .select({
      id: jobs.id,
      level: jobs.level,
      region: jobs.region,
      category: jobs.category,
      required: jobs.required,
      summary: jobs.summary,
      postedAt: jobs.postedAt,
    })
    .from(jobs)
    .where(isNull(jobs.closedAt))
  if (!open.length) return 0

  let written = 0
  for (const userId of people) {
    const profile = await loadProfile(db, userId)
    const rows = open.map((j) => {
      const s = scoreFor(
        {
          level: j.level,
          region: j.region,
          category: j.category,
          required: j.required,
          hasDescription: Boolean(j.summary),
          postedAt: j.postedAt,
        },
        profile,
        now,
      )
      return { userId, jobId: j.id, ...s, updatedAt: now }
    })
    for (let i = 0; i < rows.length; i += 500) {
      await db
        .insert(jobMatches)
        .values(rows.slice(i, i + 500))
        .onConflictDoUpdate({
          target: [jobMatches.userId, jobMatches.jobId],
          set: {
            score: sql`excluded.score`,
            matched: sql`excluded.matched`,
            missing: sql`excluded.missing`,
            reasons: sql`excluded.reasons`,
            updatedAt: sql`excluded.updated_at`,
          },
        })
    }
    written += rows.length
  }
  return written
}

/** True when this person has no scores yet (a new account) while open jobs exist. */
export async function needsScores(db: DB, userId: string): Promise<boolean> {
  const [{ mine }] = await db
    .select({ mine: sql<number>`count(*)::int` })
    .from(jobMatches)
    .where(eq(jobMatches.userId, userId))
  if (mine > 0) return false
  const [{ open }] = await db
    .select({ open: sql<number>`count(*)::int` })
    .from(jobs)
    .where(isNull(jobs.closedAt))
  return open > 0
}
