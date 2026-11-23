'use server'

import { count, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { getAuth, PASSWORD_MIN } from '@/lib/auth/auth'
import { signupGate } from '@/lib/auth/gate'
import { findInviteByToken, isEmail, normalizeEmail } from '@/lib/auth/invites'
import { verifyPassword } from '@/lib/auth/password'

export type FormState = { error?: string }

const NAME_MAX = 80

function readAccount(form: FormData): { name: string; password: string; error?: string } {
  const name = String(form.get('name') ?? '')
    .trim()
    .slice(0, NAME_MAX)
  const password = String(form.get('password') ?? '')
  const confirm = String(form.get('confirm') ?? '')
  if (!name) return { name, password, error: 'Enter your name.' }
  if (password.length < PASSWORD_MIN)
    return { name, password, error: `Use a password of at least ${PASSWORD_MIN} characters.` }
  if (password.length > 128) return { name, password, error: 'Use a password of at most 128 characters.' }
  if (password !== confirm) return { name, password, error: 'The two passwords are different.' }
  return { name, password }
}

async function createAccount(email: string, role: 'admin' | 'user', name: string, password: string) {
  const auth = await getAuth()
  const h = await headers()
  await signupGate.run({ email, role }, () => auth.api.signUpEmail({ body: { name, email, password }, headers: h }))
}

function signUpError(e: unknown): string {
  const code = (e as { body?: { code?: string } })?.body?.code ?? ''
  console.error('[sign-up] failed:', code || (e instanceof Error ? e.message : String(e)))
  if (code.includes('ALREADY_EXISTS')) return 'An account with this email already exists. Sign in instead.'
  if (code.includes('PASSWORD_TOO')) return `Use a password of ${PASSWORD_MIN} to 128 characters.`
  return 'The account could not be created. Try again, or ask for a new invite.'
}

/** Sign-up from an invite link. The email comes from the invite, not the form. */
export async function signUpWithInvite(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get('invite') ?? '')
  const db = await getDb()
  const invite = await findInviteByToken(db, token)
  if (!invite) return { error: 'This invite link has expired or was already used. Ask for a new one.' }
  const { name, password, error } = readAccount(form)
  if (error) return { error }
  try {
    await createAccount(invite.email, 'user', name, password)
  } catch (e) {
    return { error: signUpError(e) }
  }
  redirect('/')
}

/** True once someone has claimed the admin account. */
export async function hasAdmin(): Promise<boolean> {
  const db = await getDb()
  const [{ n }] = await db.select({ n: count() }).from(users).where(eq(users.role, 'admin'))
  return n > 0
}

let setupFailures = 0

/**
 * First-time setup: the owner creates the admin account. The current Jobber password (APP_PASSWORD_HASH,
 * set with `npm run set-password`) proves it's the owner. Works only while no admin exists.
 */
export async function setupOwner(_prev: FormState, form: FormData): Promise<FormState> {
  if (await hasAdmin()) return { error: 'Jobber is already set up. Sign in instead.' }
  const ownerPassword = String(form.get('ownerPassword') ?? '')
  const ok = ownerPassword.length > 0 && (await verifyPassword(ownerPassword, process.env.APP_PASSWORD_HASH))
  if (!ok) {
    // Slow down repeated guesses.
    setupFailures++
    await new Promise((r) => setTimeout(r, Math.min(500 * setupFailures, 5000)))
    return { error: 'That is not the current Jobber password.' }
  }
  setupFailures = 0
  const email = normalizeEmail(String(form.get('email') ?? ''))
  if (!isEmail(email)) return { error: 'Enter a valid email address.' }
  const { name, password, error } = readAccount(form)
  if (error) return { error }
  try {
    await createAccount(email, 'admin', name, password)
  } catch (e) {
    return { error: signUpError(e) }
  }
  redirect('/')
}

export async function signOut(): Promise<void> {
  const auth = await getAuth()
  await auth.api.signOut({ headers: await headers() }).catch(() => undefined)
  redirect('/login')
}
