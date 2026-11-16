'use server'

import { redirect } from 'next/navigation'
import { verifyPassword } from '@/lib/auth/password'
import { endSession, startSession } from '@/lib/auth/session'

export type LoginState = { error?: string }

const failures = new Map<string, number>()

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const hash = process.env.APP_PASSWORD_HASH
  if (!hash || !process.env.SESSION_SECRET) {
    return { error: 'No password is set yet. Run "npm run set-password" in the jobber folder, then restart the app.' }
  }

  const password = String(form.get('password') ?? '')
  // Slow down repeated guesses: 0.5s, then a little more per recent failure.
  const recent = failures.get('all') ?? 0
  const ok = password.length > 0 && (await verifyPassword(password, hash))
  if (!ok) {
    failures.set('all', recent + 1)
    await new Promise((r) => setTimeout(r, Math.min(500 + recent * 500, 5000)))
    return { error: 'That password is not right.' }
  }

  failures.delete('all')
  await startSession()
  redirect('/')
}

export async function signOut(): Promise<void> {
  await endSession()
  redirect('/login')
}
