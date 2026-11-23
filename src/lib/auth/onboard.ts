import { and, count, eq, isNull } from 'drizzle-orm'
import type { DB } from '@/db'
import { abouts, applications, profiles, resumeFiles, resumes, settings, users, type Role } from '@/db/schema'
import { defaultProfile, type Profile } from '@/jobs/score'
import { defaultAbout } from '@/resume/about'
import { blankResume } from '@/resume/edit-ops'
import { masterResume } from '@/resume/master'
import { allSkills, type ResumeContent } from '@/resume/types'
import { markInvitesUsed } from './invites'

export type NewAccount = { id: string; email: string; role: Role }

/** Runs once, right after an account is created. */
export async function onAccountCreated(db: DB, user: NewAccount): Promise<void> {
  await markInvitesUsed(db, user.email, user.id)
  if (user.role === 'admin') await claimForOwner(db, user.id)
  else await startFresh(db, user.id, user.email)
}

/**
 * The owner's account takes over everything stored before accounts existed (rows with no owner) and the old
 * single matching profile. On a brand-new database it starts from the owner's master resume and About you.
 */
export async function claimForOwner(db: DB, userId: string): Promise<void> {
  for (const table of [resumes, abouts, applications, resumeFiles]) {
    await db.update(table).set({ userId }).where(isNull(table.userId))
  }

  const [old] = await db.select().from(settings).where(eq(settings.key, 'profile'))
  const legacy = (old?.value as Profile | undefined) ?? defaultProfile
  await db.insert(profiles).values({ userId, skills: legacy.skills, preferred: legacy.preferred }).onConflictDoNothing()

  const [{ n }] = await db.select({ n: count() }).from(resumes).where(eq(resumes.userId, userId))
  if (n === 0) {
    await db.insert(resumes).values({ userId, name: 'Master resume', isMaster: true, content: masterResume })
    await db
      .update(profiles)
      .set({ skills: allSkills(masterResume) })
      .where(eq(profiles.userId, userId))
  }
  const [{ a }] = await db.select({ a: count() }).from(abouts).where(eq(abouts.userId, userId))
  if (a === 0) {
    await db.insert(abouts).values({ userId, title: 'AI Engineer at Parcera (general)', text: defaultAbout })
  }
}

/** Someone invited: an empty master resume with their name and email, and an empty skills profile. */
export async function startFresh(db: DB, userId: string, email: string): Promise<void> {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId))
  const content: ResumeContent = blankResume(masterResume)
  content.contact = {
    hidden: false,
    name: u?.name ?? '',
    title: '',
    location: '',
    email,
    github: '',
    linkedin: '',
    website: '',
  }
  content.education = { hidden: false, items: [] }
  const [{ n }] = await db
    .select({ n: count() })
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.isMaster, true)))
  if (n === 0) await db.insert(resumes).values({ userId, name: 'Master resume', isMaster: true, content })
  await db.insert(profiles).values({ userId, skills: [], preferred: defaultProfile.preferred }).onConflictDoNothing()
}
