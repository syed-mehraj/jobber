import { connection } from 'next/server'
import { greeting, istHour } from '@/lib/greeting'

const headingClass = 'text-[24px] leading-8 font-semibold tracking-[-0.02em] sm:text-page'

/** "Good morning, Syed" in India time. Rendered per request, so it streams in after the static shell. */
export async function GreetingHeading({ name }: { name: string }) {
  await connection()
  return (
    <h1 className={headingClass}>
      {greeting(istHour(new Date()))}, {name}
    </h1>
  )
}

export function GreetingFallback({ name }: { name: string }) {
  return <h1 className={headingClass}>Hello, {name}</h1>
}
