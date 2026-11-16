import 'server-only'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
import { syncCatalog } from './seed'

/**
 * One database API for both places the app runs:
 * - DATABASE_URL set (Neon on Vercel, or any Postgres): node-postgres.
 * - Not set (local development): PGlite, a real Postgres running in-process, stored in .data/pglite.
 * Migrations from ./drizzle are applied on first use, then the source catalog is synced.
 */
export type DB = NodePgDatabase<typeof schema>

const migrationsFolder = path.join(process.cwd(), 'drizzle')

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    const db = drizzle(new Pool({ connectionString: url, max: 3 }), { schema })
    await migrate(db, { migrationsFolder })
    return db
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.data', 'pglite')
  // PGlite creates its own folder but not the ones above it (.data/ doesn't exist on a fresh checkout).
  mkdirSync(path.dirname(dir), { recursive: true })
  const db = drizzle(new PGlite(dir), { schema })
  await migrate(db, { migrationsFolder })
  return db as unknown as DB
}

const globalForDb = globalThis as unknown as { __jobberDb?: Promise<DB> }

export function getDb(): Promise<DB> {
  globalForDb.__jobberDb ??= connect()
    .then(async (db) => {
      await syncCatalog(db)
      return db
    })
    .catch((error) => {
      globalForDb.__jobberDb = undefined
      throw error
    })
  return globalForDb.__jobberDb
}

export { schema }
