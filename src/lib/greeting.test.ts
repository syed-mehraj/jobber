import { describe, expect, it } from 'vitest'
import { greeting, istHour } from './greeting'

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greeting(7)).toBe('Good morning')
    expect(greeting(13)).toBe('Good afternoon')
    expect(greeting(20)).toBe('Good evening')
  })
})

describe('istHour', () => {
  it('converts to India Standard Time (UTC+5:30)', () => {
    expect(istHour(new Date('2026-11-16T01:30:00Z'))).toBe(7)
    expect(istHour(new Date('2026-11-16T18:29:00Z'))).toBe(23)
    expect(istHour(new Date('2026-11-16T18:30:00Z'))).toBe(0)
  })
})
