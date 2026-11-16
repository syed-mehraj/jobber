import { count, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { catalog } from '@/jobs/catalog'
import { defaultProfile } from '@/jobs/score'
import { masterResume } from '@/resume/master'
import { allSkills } from '@/resume/types'
import * as schema from './schema'

/**
 * Brings the sources table in line with src/jobs/catalog.ts and stores the default matching profile once.
 * On a database with no resumes it also adds the master resume and bases the profile's skills on it.
 */
export async function syncCatalog(db: NodePgDatabase<typeof schema>): Promise<void> {
  if (catalog.length) {
    await db
      .insert(schema.sources)
      .values(catalog.map((c) => ({ key: c.key, kind: c.kind, name: c.name, config: c.config })))
      .onConflictDoUpdate({
        target: schema.sources.key,
        set: { kind: sql`excluded.kind`, name: sql`excluded.name`, config: sql`excluded.config` },
      })
  }
  await db.insert(schema.settings).values({ key: 'profile', value: defaultProfile }).onConflictDoNothing()

  const [{ n }] = await db.select({ n: count() }).from(schema.resumes)
  if (n === 0) {
    await db.insert(schema.resumes).values({ name: 'Master resume', isMaster: true, content: masterResume })
    // The skills on the master resume are the skills to match jobs against. Keep the preferred categories.
    const value = { skills: allSkills(masterResume), preferred: defaultProfile.preferred }
    await db
      .insert(schema.settings)
      .values({ key: 'profile', value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: sql`now()` } })
  }
}
