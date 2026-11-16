import 'server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { connection } from 'next/server'
import { getDb } from '@/db'
import { abouts, resumes } from '@/db/schema'
import { requireSession } from '@/lib/auth/session'
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
}

async function db() {
  // Reads depend on the request and the session, so they are never prerendered.
  await connection()
  await requireSession()
  return getDb()
}

type Row = typeof resumes.$inferSelect
const toRecord = (r: Row): ResumeRecord => ({
  id: r.id,
  name: r.name,
  isMaster: r.isMaster,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  content: toContent(r.content),
})

/** All resumes: the master first, then the rest by most recently edited. */
export async function getResumes(): Promise<ResumeRecord[]> {
  const d = await db()
  const rows = await d.select().from(resumes).orderBy(desc(resumes.isMaster), desc(resumes.updatedAt), asc(resumes.id))
  return rows.map(toRecord)
}

/** One resume, or null when there is none with that id. */
export async function getResume(id: number): Promise<ResumeRecord | null> {
  const d = await db()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return null
  const [row] = await d.select().from(resumes).where(eq(resumes.id, id)).limit(1)
  return row ? toRecord(row) : null
}

/** Every "About you" description, most recently edited first. */
export async function getAbouts(): Promise<About[]> {
  const d = await db()
  return d
    .select({
      id: abouts.id,
      title: abouts.title,
      target: abouts.target,
      text: abouts.text,
      updatedAt: abouts.updatedAt,
    })
    .from(abouts)
    .orderBy(desc(abouts.updatedAt), desc(abouts.id))
}
