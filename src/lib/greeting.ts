export function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** The hour (0–23) in India Standard Time for a given instant. */
export function istHour(date: Date): number {
  const hour = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(
    date,
  )
  return Number(hour)
}
