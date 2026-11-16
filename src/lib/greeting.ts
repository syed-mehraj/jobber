/** "Good morning / afternoon / evening" for an hour of the day in IST (0–23). */
export function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
