import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { catalog as officialCatalog } from '@/jobs/catalog'
import { internationalCatalog } from '@/jobs/catalog-international'
import { unofficialCatalog } from '@/jobs/catalog-unofficial'
import * as schema from './schema'

/**
 * Brings the sources table in line with the catalogs. Personal data (resumes, About you, the matching profile)
 * belongs to accounts now; see src/lib/auth/onboard.ts.
 */
export async function syncCatalog(db: NodePgDatabase<typeof schema>): Promise<void> {
  const catalog = [...officialCatalog, ...internationalCatalog, ...unofficialCatalog]
  if (catalog.length) {
    await db
      .insert(schema.sources)
      .values(catalog.map((c) => ({ key: c.key, kind: c.kind, name: c.name, config: c.config })))
      .onConflictDoUpdate({
        target: schema.sources.key,
        set: { kind: sql`excluded.kind`, name: sql`excluded.name`, config: sql`excluded.config` },
      })
  }
}
