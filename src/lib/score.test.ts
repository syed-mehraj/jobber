import { describe, expect, it } from 'vitest'
import { scoreBand } from './score'

describe('scoreBand', () => {
  it('uses the DESIGN.md boundaries', () => {
    expect(scoreBand(100)).toBe('strong')
    expect(scoreBand(80)).toBe('strong')
    expect(scoreBand(79)).toBe('good')
    expect(scoreBand(60)).toBe('good')
    expect(scoreBand(59)).toBe('partial')
    expect(scoreBand(40)).toBe('partial')
    expect(scoreBand(39)).toBe('weak')
    expect(scoreBand(0)).toBe('weak')
  })
})
