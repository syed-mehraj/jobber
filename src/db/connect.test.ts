import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const root = mkdtempSync(path.join(tmpdir(), 'jobber-db-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('getDb (local PGlite)', () => {
  it('starts on a fresh checkout where .data/ does not exist yet', async () => {
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv('PGLITE_DIR', path.join(root, 'missing-parent', 'pglite'))
    const { getDb } = await import('.')
    const db = await getDb()
    const sources = await db.query.sources.findMany()
    expect(sources.length).toBeGreaterThan(0)
    vi.unstubAllEnvs()
  }, 60000)
})
