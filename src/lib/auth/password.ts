import { randomBytes, scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from 'node:crypto'

/*
 * Password hashing with Node's built-in scrypt.
 * Stored as "scrypt:<salt>:<hash>" in base64url, which is safe inside .env files
 * (no "$", so Next's variable expansion leaves it alone).
 */

const KEY_LENGTH = 32
const OPTIONS: ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

function derive(password: BinaryLike, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, OPTIONS, (err, key) => (err ? reject(err) : resolve(key))),
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt)
  return `scrypt:${salt.toString('base64url')}:${key.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false
  const [scheme, saltText, keyText] = stored.split(':')
  if (scheme !== 'scrypt' || !saltText || !keyText) return false
  const expected = Buffer.from(keyText, 'base64url')
  const actual = await derive(password, Buffer.from(saltText, 'base64url'))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
