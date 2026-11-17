/*
 * Country guide for the Abroad tab: how realistic a work visa is for a 2027 Indian CS graduate, junior pay,
 * safety, friendliness to foreigners and competition. Filled from research (docs/ABROAD.md); every figure there
 * has a source. Update yearly: thresholds and rankings change.
 */

export type Realism = 'High' | 'Medium' | 'Low'

export type CountryInfo = {
  code: string
  name: string
  rank: number
  visa: string
  visaRealism: Realism
  juniorPay: string
  juniorPayInr: string
  tax: string
  safety: string
  friendliness: string
  competition: string
  english: string
  nature: string
  verdict: string
  sources: string[]
  companies: { name: string; city: string }[]
}

export const guideAsOf = ''
export const countryGuide: CountryInfo[] = []
