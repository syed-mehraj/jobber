import type { User } from '@/components/shell/types'

/** What the header and dashboard show for the signed-in person: first name and initials. */
export function displayUser(user: { name: string; role?: string } | null): User {
  const words = (user?.name ?? '').trim().split(/\s+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
  return { firstName: words[0] ?? '', initials: initials || '·', isAdmin: user?.role === 'admin' }
}
