import path from 'node:path'
import type { DB } from '.'
import * as schema from './schema'
import { syncCatalog } from './seed'

/** A fresh in-memory database with migrations applied, for tests. */
export async function createTestDb({ seed = false } = {}): Promise<DB> {
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const db = drizzle(new PGlite(), { schema }) as unknown as DB
  await migrate(db as never, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
  if (seed) await syncCatalog(db)
  return db
}
