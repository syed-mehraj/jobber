import { describe, expect, it } from 'vitest'
import { COUNTRY_FLAGS, countryOf } from './countries'

describe('countryOf', () => {
  it('names the first known place', () => {
    expect(countryOf('Berlin, Germany')).toBe('DE')
    expect(countryOf('Amsterdam; London')).toBe('NL')
    expect(countryOf('Zürich')).toBe('CH')
    expect(countryOf('Dubai, UAE')).toBe('AE')
    expect(countryOf('Kuwait City')).toBe('KW')
    expect(countryOf('San Francisco, CA')).toBe('US')
    expect(countryOf('Seattle, WA; Toronto')).toBe('US')
    expect(countryOf('Bengaluru, Karnataka, IND')).toBe('IN')
    expect(countryOf('Hyderabad, IN')).toBe('IN')
    expect(countryOf('Remote')).toBeNull()
  })
  it('does not confuse words inside other words', () => {
    expect(countryOf('Ukraine (remote)')).toBeNull()
    expect(countryOf('Parisian Ave, Chicago')).toBe('US')
  })
  it('has flags', () => {
    expect(COUNTRY_FLAGS.DE).toBe('🇩🇪')
  })
})
