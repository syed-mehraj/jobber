import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { catalog } from '@/jobs/catalog'
import { defaultProfile } from '@/jobs/score'
import * as schema from './schema'

/** Brings the sources table in line with src/jobs/catalog.ts and stores the default matching profile once. */
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
}
