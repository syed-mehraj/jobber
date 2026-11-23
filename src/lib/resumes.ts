import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import { connection } from 'next/server'
import { getDb } from '@/db'
import { abouts, resumeFiles, resumes } from '@/db/schema'
import { requireUser } from '@/lib/auth/session'
import type { About } from '@/resume/about'
import { toContent, type ResumeContent } from '@/resume/types'

export type ResumeRecord = {
  id: number
  name: string
  isMaster: boolean
  createdAt: Date
  updatedAt: Date
  /** Null when the stored JSON is not a resume of the current shape. */
  content: ResumeContent | null
  /** Raw design JSON; read it with toDesign from src/resume/design.ts. */
  design: unknown
  target: string | null
  /** The uploaded original, if this resume came from a file. */
  file: { name: string; size: number } | null
}

/** The database and the signed-in person's id. Every query below filters by it. */
async function ctx() {
  // Reads depend on the request and the session, so they are never prerendered.
  await connection()
  const user = await requireUser()
  return { d: await getDb(), userId: user.id }
}

type Row = typeof resumes.$inferSelect
const toRecord = (r: Row, file: { name: string; size: number } | null = null): ResumeRecord => ({
  id: r.id,
  name: r.name,
  isMaster: r.isMaster,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  content: toContent(r.content),
  design: r.design,
  target: r.target,
  file,
})

/** All resumes: the master first, then the rest by most recently edited. */
export async function getResumes(): Promise<ResumeRecord[]> {
  const { d, userId } = await ctx()
  const rows = await d
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.isMaster), desc(resumes.updatedAt), asc(resumes.id))
  const files = await d
    .select({ resumeId: resumeFiles.resumeId, name: resumeFiles.name, size: resumeFiles.size })
    .from(resumeFiles)
    .where(eq(resumeFiles.userId, userId))
  const byResume = new Map(files.map((f) => [f.resumeId, { name: f.name, size: f.size }]))
  return rows.map((r) => toRecord(r, byResume.get(r.id) ?? null))
}

/** One of the signed-in person's resumes, or null when they have none with that id. */
export async function getResume(id: number): Promise<ResumeRecord | null> {
  const { d, userId } = await ctx()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return null
  const [row] = await d
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1)
  if (!row) return null
  const [file] = await d
    .select({ name: resumeFiles.name, size: resumeFiles.size })
    .from(resumeFiles)
    .where(and(eq(resumeFiles.resumeId, id), eq(resumeFiles.userId, userId)))
    .limit(1)
  return toRecord(row, file ?? null)
}

/** The signed-in person's "About you" descriptions, most recently edited first. */
export async function getAbouts(): Promise<About[]> {
  const { d, userId } = await ctx()
  return d
    .select({
      id: abouts.id,
      title: abouts.title,
      target: abouts.target,
      text: abouts.text,
      updatedAt: abouts.updatedAt,
    })
    .from(abouts)
    .where(eq(abouts.userId, userId))
    .orderBy(desc(abouts.updatedAt), desc(abouts.id))
}
