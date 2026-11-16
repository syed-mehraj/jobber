import { describe, expect, it } from 'vitest'
import { greeting } from './greeting'

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greeting(7)).toBe('Good morning')
    expect(greeting(13)).toBe('Good afternoon')
    expect(greeting(20)).toBe('Good evening')
  })
})
