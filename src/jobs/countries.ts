/*
 * Which country a job is in, from its location text. Covers India and the countries the Abroad section
 * targets. Returns an ISO 3166 alpha-2 code, or null when no known place is named.
 * When a posting lists several places, the first one named wins.
 */

export type CountryCode =
  | 'IN'
  | 'US'
  | 'DE'
  | 'NL'
  | 'CH'
  | 'IE'
  | 'GB'
  | 'AU'
  | 'NZ'
  | 'CA'
  | 'AE'
  | 'KW'
  | 'SA'
  | 'QA'
  | 'SG'
  | 'JP'
  | 'SE'
  | 'DK'
  | 'FI'
  | 'NO'
  | 'AT'
  | 'LU'
  | 'EE'
  | 'PT'
  | 'PL'
  | 'ES'
  | 'FR'
  | 'BE'
  | 'LT'

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  IN: 'India',
  US: 'United States',
  DE: 'Germany',
  NL: 'Netherlands',
  CH: 'Switzerland',
  IE: 'Ireland',
  GB: 'United Kingdom',
  AU: 'Australia',
  NZ: 'New Zealand',
  CA: 'Canada',
  AE: 'UAE',
  KW: 'Kuwait',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  SG: 'Singapore',
  JP: 'Japan',
  SE: 'Sweden',
  DK: 'Denmark',
  FI: 'Finland',
  NO: 'Norway',
  AT: 'Austria',
  LU: 'Luxembourg',
  EE: 'Estonia',
  PT: 'Portugal',
  PL: 'Poland',
  ES: 'Spain',
  FR: 'France',
  BE: 'Belgium',
  LT: 'Lithuania',
}

export const COUNTRY_FLAGS: Record<CountryCode, string> = Object.fromEntries(
  Object.keys(COUNTRY_NAMES).map((c) => [c, String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0)))]),
) as Record<CountryCode, string>

const PLACES: [CountryCode, string[]][] = [
  [
    'IN',
    [
      'india',
      'bengaluru',
      'bangalore',
      'hyderabad',
      'pune',
      'gurugram',
      'gurgaon',
      'chennai',
      'mumbai',
      'noida',
      'delhi',
      'kolkata',
      'ahmedabad',
      'kochi',
    ],
  ],
  [
    'DE',
    [
      'germany',
      'deutschland',
      'berlin',
      'munich',
      'münchen',
      'muenchen',
      'hamburg',
      'frankfurt',
      'cologne',
      'köln',
      'stuttgart',
      'düsseldorf',
      'dusseldorf',
      'leipzig',
      'karlsruhe',
      'heidelberg',
      'nuremberg',
      'nürnberg',
    ],
  ],
  [
    'NL',
    [
      'netherlands',
      'the netherlands',
      'nederland',
      'nederlands',
      'holland',
      'amsterdam',
      'rotterdam',
      'utrecht',
      'eindhoven',
      'the hague',
      'den haag',
      'delft',
    ],
  ],
  ['CH', ['switzerland', 'zurich', 'zürich', 'geneva', 'genève', 'basel', 'lausanne', 'bern', 'zug', 'lugano']],
  ['IE', ['ireland', 'dublin', 'cork', 'galway', 'limerick']],
  [
    'GB',
    [
      'united kingdom',
      'uk',
      'england',
      'scotland',
      'london',
      'manchester',
      'edinburgh',
      'cambridge',
      'oxford',
      'bristol',
      'leeds',
      'glasgow',
      'belfast',
    ],
  ],
  ['AU', ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra']],
  ['NZ', ['new zealand', 'auckland', 'wellington', 'christchurch']],
  ['CA', ['canada', 'toronto', 'vancouver', 'montreal', 'montréal', 'waterloo', 'ottawa', 'calgary', 'edmonton']],
  ['AE', ['united arab emirates', 'uae', 'dubai', 'abu dhabi', 'sharjah']],
  ['KW', ['kuwait']],
  ['SA', ['saudi arabia', 'ksa', 'riyadh', 'jeddah', 'dammam', 'khobar']],
  ['QA', ['qatar', 'doha']],
  ['SG', ['singapore']],
  ['JP', ['japan', 'tokyo', 'osaka', 'kyoto', 'fukuoka']],
  ['SE', ['sweden', 'stockholm', 'gothenburg', 'göteborg', 'malmö', 'malmo']],
  ['DK', ['denmark', 'copenhagen', 'aarhus']],
  ['FI', ['finland', 'helsinki', 'espoo', 'tampere', 'oulu']],
  ['NO', ['norway', 'oslo', 'bergen', 'trondheim']],
  ['AT', ['austria', 'vienna', 'wien', 'graz', 'linz']],
  ['LU', ['luxembourg']],
  ['EE', ['estonia', 'tallinn', 'tartu']],
  ['PT', ['portugal', 'lisbon', 'lisboa', 'porto', 'braga']],
  ['PL', ['poland', 'warsaw', 'warszawa', 'krakow', 'kraków', 'wroclaw', 'wrocław', 'gdansk', 'gdańsk', 'poznan']],
  ['ES', ['spain', 'madrid', 'barcelona', 'valencia', 'malaga', 'málaga']],
  ['FR', ['france', 'paris', 'lyon', 'toulouse', 'nice']],
  ['BE', ['belgium', 'brussels', 'antwerp', 'ghent']],
  ['LT', ['lithuania', 'vilnius', 'kaunas']],
  [
    'US',
    [
      'united states',
      'usa',
      'u.s.',
      'new york',
      'san francisco',
      'seattle',
      'austin',
      'boston',
      'chicago',
      'los angeles',
      'mountain view',
      'palo alto',
      'menlo park',
      'sunnyvale',
      'san jose',
      'redmond',
      'denver',
      'atlanta',
      'washington, dc',
      'bay area',
    ],
  ],
]

const US_STATE =
  /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/

/** The first known country a location names, or null. */
export function countryOf(location: string): CountryCode | null {
  const text = location.toLowerCase()
  let best: { code: CountryCode; at: number } | null = null
  for (const [code, names] of PLACES) {
    for (const n of names) {
      const m = new RegExp(`(^|[^a-zà-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zà-ÿ]|$)`).exec(text)
      if (m && (!best || m.index < best.at)) best = { code, at: m.index }
    }
  }
  const st = US_STATE.exec(location)
  if (st && (!best || st.index < best.at)) best = { code: 'US', at: st.index }
  return best?.code ?? null
}
