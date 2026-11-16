/** "just now", "5 min ago", "3 h ago", "2 days ago", or a date. */
export function timeAgo(date: Date | null | undefined, now = new Date()): string {
  if (!date) return 'never'
  const s = Math.max(0, (now.getTime() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  const days = Math.floor(s / 86400)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

export const levelLabel = {
  intern: 'Internship',
  'new-grad': 'New grad',
  entry: 'Entry level',
  unspecified: 'Level not stated',
} as const
export const regionLabel = {
  hyderabad: 'Hyderabad',
  india: 'India',
  remote: 'Remote',
  international: 'Abroad',
} as const
