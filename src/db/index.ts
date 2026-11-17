import 'server-only'
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
import { syncCatalog } from './seed'

/**
 * One database API for both places the app runs:
 * - DATABASE_URL set (Neon on Vercel, or any Postgres): node-postgres.
 * - Not set (local development): PGlite, a real Postgres running in-process, stored in .data/pglite.
 * Migrations from ./drizzle are applied on first use, then the source catalog is synced. While the app runs,
 * a new migration (or a changed catalog) is picked up on the next request, so a long-running dev server
 * never queries a column that doesn't exist yet.
 */
export type DB = NodePgDatabase<typeof schema>

const migrationsFolder = path.join(process.cwd(), 'drizzle')
const journal = path.join(migrationsFolder, 'meta', '_journal.json')

type Connection = { db: DB; migrate: () => Promise<void> }

async function connect(): Promise<Connection> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    const db = drizzle(new Pool({ connectionString: url, max: 3 }), { schema })
    return { db, migrate: () => migrate(db, { migrationsFolder }) }
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.data', 'pglite')
  // PGlite creates its own folder but not the ones above it (.data/ doesn't exist on a fresh checkout).
  mkdirSync(path.dirname(dir), { recursive: true })
  const db = drizzle(new PGlite(dir), { schema })
  return { db: db as unknown as DB, migrate: () => migrate(db, { migrationsFolder }) }
}

/** When the migrations last changed; 0 if the journal can't be read (e.g. bundled without it). */
function journalStamp(): number {
  try {
    return statSync(journal).mtimeMs
  } catch {
    return 0
  }
}

type Cached = { ready: Promise<DB>; stamp: number; conn?: Promise<Connection> }
const globalForDb = globalThis as unknown as { __jobberDb?: Cached }

async function prepare(conn: Connection): Promise<DB> {
  await conn.migrate()
  await syncCatalog(conn.db)
  return conn.db
}

export function getDb(): Promise<DB> {
  const stamp = journalStamp()
  const cached = globalForDb.__jobberDb
  if (cached && cached.stamp === stamp) return cached.ready

  // First use, or the migrations changed while the app was running: (re)apply them on the same connection.
  const conn = cached?.conn ?? connect()
  const ready = conn.then(prepare).catch((error) => {
    globalForDb.__jobberDb = undefined
    throw error
  })
  globalForDb.__jobberDb = { ready, stamp, conn }
  return ready
}

export { schema }
