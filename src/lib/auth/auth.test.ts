import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DB } from '@/db'
import { invites, resumes, sessions, users } from '@/db/schema'
import { createTestDb } from '@/db/testing'
import { hashPassword } from 'better-auth/crypto'

vi.mock('server-only', () => ({}))

const { createAuth } = await import('./auth')
const { signupGate } = await import('./gate')
const { ensureOwner, isOwnerEmail } = await import('./owner')
const { createInvite, findInviteByEmail, findInviteByToken, hashInviteToken } = await import('./invites')

describe('accounts', () => {
  let db: DB
  let auth: ReturnType<typeof createAuth>
  const base = 'http://localhost:3000'
  const post = (path: string, body: unknown, ip = '10.0.0.1') =>
    auth.handler(
      new Request(`${base}/api/auth${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: base, 'x-forwarded-for': ip },
        body: JSON.stringify(body),
      }),
    )
  const signUp = (email: string, password = 'a long password 1') =>
    auth.api.signUpEmail({ body: { name: 'Test Person', email, password } })

  beforeEach(async () => {
    vi.stubEnv('BETTER_AUTH_URL', base)
    vi.stubEnv('SESSION_SECRET', 'test-secret-'.padEnd(48, 'x'))
    db = await createTestDb()
    auth = createAuth(db)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('makes an admin only for OWNER_EMAIL, and only once', async () => {
    vi.stubEnv('OWNER_EMAIL', 'Owner@Example.com')
    await signupGate.run({ email: 'owner@example.com', role: 'admin' }, () => signUp('Owner@Example.com'))
    const [owner] = await db.select().from(users)
    expect(owner).toMatchObject({ email: 'owner@example.com', role: 'admin', emailVerified: true })

    // A gate pass for admin with any other email is refused.
    await expect(
      signupGate.run({ email: 'second@example.com', role: 'admin' }, () => signUp('second@example.com')),
    ).rejects.toThrow()
    expect(await db.select().from(users)).toHaveLength(1)
  })

  it('refuses every admin when OWNER_EMAIL is not set', async () => {
    vi.stubEnv('OWNER_EMAIL', '')
    expect(isOwnerEmail('owner@example.com')).toBe(false)
    await expect(
      signupGate.run({ email: 'owner@example.com', role: 'admin' }, () => signUp('owner@example.com')),
    ).rejects.toThrow()
    expect(await db.select().from(users)).toHaveLength(0)
  })

  it('creates the owner from the environment, moves old data in, and signs in with that password', async () => {
    await db.insert(resumes).values({ name: 'Old master', isMaster: true, content: {} })
    vi.stubEnv('OWNER_EMAIL', 'owner@example.com')
    vi.stubEnv('OWNER_NAME', 'The Owner')
    vi.stubEnv('OWNER_PASSWORD_HASH', await hashPassword('owner password 1'))
    const ctx = await auth.$context

    expect(await ensureOwner(db, ctx)).toBe('created')
    const [owner] = await db.select().from(users)
    expect(owner).toMatchObject({ email: 'owner@example.com', name: 'The Owner', role: 'admin' })
    const [old] = await db.select().from(resumes).where(eq(resumes.name, 'Old master'))
    expect(old.userId).toBe(owner.id)

    expect((await post('/sign-in/email', { email: 'owner@example.com', password: 'owner password 1' })).status).toBe(
      200,
    )
    expect(await ensureOwner(db, ctx)).toBe('unchanged')
    expect(await db.select().from(sessions)).toHaveLength(1)

    // A new hash in the environment replaces the password and signs the owner out everywhere.
    vi.stubEnv('OWNER_PASSWORD_HASH', await hashPassword('new owner password'))
    expect(await ensureOwner(db, ctx)).toBe('password-updated')
    expect(await db.select().from(sessions)).toHaveLength(0)
    expect(
      (await post('/sign-in/email', { email: 'owner@example.com', password: 'owner password 1' }, '10.0.0.5')).status,
    ).toBe(401)
    expect(
      (await post('/sign-in/email', { email: 'owner@example.com', password: 'new owner password' }, '10.0.0.5')).status,
    ).toBe(200)
  })

  it('takes admin away from anyone who is not OWNER_EMAIL', async () => {
    vi.stubEnv('OWNER_EMAIL', 'old@example.com')
    await signupGate.run({ email: 'old@example.com', role: 'admin' }, () => signUp('old@example.com'))
    vi.stubEnv('OWNER_EMAIL', 'new@example.com')
    vi.stubEnv('OWNER_PASSWORD_HASH', await hashPassword('owner password 1'))
    expect(await ensureOwner(db, await auth.$context)).toBe('created')
    const roles = Object.fromEntries((await db.select().from(users)).map((u) => [u.email, u.role]))
    expect(roles).toEqual({ 'old@example.com': 'user', 'new@example.com': 'admin' })
  })

  it('does nothing without OWNER_EMAIL and OWNER_PASSWORD_HASH, or with a bad hash', async () => {
    vi.stubEnv('OWNER_EMAIL', '')
    vi.stubEnv('OWNER_PASSWORD_HASH', '')
    expect(await ensureOwner(db, await auth.$context)).toBe('not-configured')
    vi.stubEnv('OWNER_EMAIL', 'owner@example.com')
    vi.stubEnv('OWNER_PASSWORD_HASH', 'not-a-hash')
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await ensureOwner(db, await auth.$context)).toBe('not-configured')
    err.mockRestore()
    expect(await db.select().from(users)).toHaveLength(0)
  })

  it('refuses password sign-ups without the gate, and the public endpoint is disabled', async () => {
    await expect(signUp('stranger@example.com')).rejects.toThrow()
    const res = await post('/sign-up/email', {
      name: 'X',
      email: 'stranger@example.com',
      password: 'a long password 1',
    })
    expect(res.status).toBe(404)
    expect(await db.select().from(users)).toHaveLength(0)
  })

  it('refuses a gate pass for a different email than the one being created', async () => {
    await expect(
      signupGate.run({ email: 'invited@example.com', role: 'user' }, () => signUp('other@example.com')),
    ).rejects.toThrow()
    expect(await db.select().from(users)).toHaveLength(0)
  })

  it('lets Google-style sign-ups (no gate) in only for invited emails, and uses up the invite', async () => {
    const ctx = await auth.$context
    // What Google's callback passes when it creates an account.
    const google = { method: 'oauth', oauth: { providerId: 'google', profile: {} } } as never
    // Refused: no user comes back (Google's callback then shows "unable_to_create_user") and nothing is stored.
    const refused = await ctx.internalAdapter
      .createUser({ name: 'Nobody', email: 'nobody@example.com', emailVerified: true }, google)
      .catch(() => null)
    expect(refused).toBeNull()
    expect(await db.select().from(users)).toHaveLength(0)

    // Invited, but Google says the email isn't verified: refused.
    await createInvite(db, 'unverified@example.com', null)
    const unverified = await ctx.internalAdapter
      .createUser({ name: 'U', email: 'unverified@example.com', emailVerified: false }, google)
      .catch(() => null)
    expect(unverified).toBeNull()

    const { token } = await createInvite(db, 'Friend@Example.com', null)
    expect(await findInviteByToken(db, token)).not.toBeNull()
    const user = await ctx.internalAdapter.createUser(
      { name: 'Friend', email: 'friend@example.com', emailVerified: true },
      google,
    )
    expect(user).toMatchObject({ email: 'friend@example.com', role: 'user' })
    // Used up: the link no longer works and the email needs a new invite.
    expect(await findInviteByToken(db, token)).toBeNull()
    expect(await findInviteByEmail(db, 'friend@example.com')).toBeNull()
  })

  it('stores only a hash of the invite token, and expired invites do not work', async () => {
    const now = new Date('2026-11-01T00:00:00Z')
    const { token } = await createInvite(db, 'late@example.com', null, now)
    const [row] = await db.select().from(invites)
    expect(row.tokenHash).toBe(hashInviteToken(token))
    expect(JSON.stringify(row)).not.toContain(token)
    expect(await findInviteByToken(db, token, new Date('2026-11-10T00:00:00Z'))).not.toBeNull()
    expect(await findInviteByToken(db, token, new Date('2026-11-16T00:00:00Z'))).toBeNull()
    expect(await findInviteByToken(db, 'not-a-real-token')).toBeNull()
  })

  it('signs in with the right password only, and rate-limits guessing', async () => {
    const { token } = await createInvite(db, 'friend@example.com', null)
    expect(token).toBeTruthy()
    await signupGate.run({ email: 'friend@example.com', role: 'user' }, () => signUp('friend@example.com'))

    const ok = await post('/sign-in/email', { email: 'friend@example.com', password: 'a long password 1' })
    expect(ok.status).toBe(200)
    expect(ok.headers.get('set-cookie')).toContain('session_token')

    const wrong = await post(
      '/sign-in/email',
      { email: 'friend@example.com', password: 'wrong password!!' },
      '10.0.0.2',
    )
    expect(wrong.status).toBe(401)

    const statuses: number[] = []
    for (let i = 0; i < 12; i++)
      statuses.push(
        (await post('/sign-in/email', { email: 'friend@example.com', password: `guess ${i}xxxxxx` }, '10.0.0.3'))
          .status,
      )
    expect(statuses).toContain(429)
  })

  it('never lets a request set the role', async () => {
    const { token } = await createInvite(db, 'sneaky@example.com', null)
    expect(token).toBeTruthy()
    await signupGate
      .run({ email: 'sneaky@example.com', role: 'user' }, () =>
        auth.api.signUpEmail({
          body: { name: 'S', email: 'sneaky@example.com', password: 'a long password 1', role: 'admin' } as never,
        }),
      )
      .catch(() => undefined)
    const [u] = await db.select().from(users).where(eq(users.email, 'sneaky@example.com'))
    expect(u?.role ?? 'user').toBe('user')
  })
})
