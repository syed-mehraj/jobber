import 'server-only'
import { headers } from 'next/headers'

/** This site's own address, for links people open later (invite links). */
export async function siteUrl(): Promise<string> {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
  return `${local ? 'http' : 'https'}://${host}`
}
