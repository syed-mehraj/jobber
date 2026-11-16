import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'
import { createSessionToken, verifySessionToken } from './session-token'

const secret = 'x'.repeat(43)

describe('password', () => {
  it('verifies the right password and rejects others', async () => {
    const hash = await hashPassword('correct horse battery')
    expect(hash).toMatch(/^scrypt:[\w-]+:[\w-]+$/)
    expect(await verifyPassword('correct horse battery', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
    expect(await verifyPassword('anything', undefined)).toBe(false)
  })
})

describe('session token', () => {
  it('accepts its own tokens until they expire', async () => {
    const t = await createSessionToken(secret, 1_000)
    expect(await verifySessionToken(t, secret, 2_000)).toBe(true)
    expect(await verifySessionToken(t, secret, 1_000 + 31 * 86400000)).toBe(false)
  })
  it('rejects tampered tokens, other secrets and weak secrets', async () => {
    const t = await createSessionToken(secret, 1_000)
    const [exp, sig] = t.split('.')
    expect(await verifySessionToken(`${Number(exp) + 1}.${sig}`, secret, 2_000)).toBe(false)
    expect(await verifySessionToken(t, 'y'.repeat(43), 2_000)).toBe(false)
    expect(await verifySessionToken(t, 'short', 2_000)).toBe(false)
    expect(await verifySessionToken(undefined, secret)).toBe(false)
  })
})
