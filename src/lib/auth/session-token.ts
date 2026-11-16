/*
 * Signed session tokens: "<expiry ms>.<HMAC-SHA256 signature>".
 * Uses Web Crypto only, so the same code runs in the proxy and on the server.
 * Single user, so the token carries no user id; it only proves a successful sign-in.
 */

export const SESSION_COOKIE = 'jobber_session'
export const SESSION_DAYS = 30

const encoder = new TextEncoder()

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)))
  let binary = ''
  for (const byte of mac) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const expires = now + SESSION_DAYS * 24 * 60 * 60 * 1000
  return `${expires}.${await sign(secret, `jobber:${expires}`)}`
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!token || !secret || secret.length < 32) return false
  const [expiresText, signature] = token.split('.')
  const expires = Number(expiresText)
  if (!signature || !Number.isFinite(expires) || expires <= now) return false
  return safeEqual(signature, await sign(secret, `jobber:${expires}`))
}
