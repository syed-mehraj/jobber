import type { Level, Region } from '@/db/schema'
import type { RawPosting } from './types'

/*
 * Hard filters, no AI. A posting is kept only if a 2027 CS graduate in Hyderabad can realistically get it:
 * - a software / ML / data engineering role (not sales, design, hardware, management…)
 * - internship, new grad or entry level (senior, staff, lead, "II/III" and 2+ years required are dropped)
 * - in Hyderabad, elsewhere in India, remote that India can do, or abroad with visa sponsorship
 * - not for a past intake (titles naming 2026 or earlier) and not older than 45 days
 */

export type Classified =
  { keep: false; reason: string } | { keep: true; level: Level; region: Region; category: string; flags: string[] }

const TECH =
  /\b(software|sde|swe|developer|engineer(ing)?|programmer|machine learning|ml|ai|data scien\w*|research scien\w*|researcher|applied scien\w*|data engineer|full[- ]?stack|back[- ]?end|front[- ]?end|devops|sre|android|ios|mobile)\b/i
const NOT_TECH =
  /\b(sales|account (executive|manager)|marketing|recruit\w*|talent|legal|counsel|finance|accountant|payroll|hr|human resources|customer|support|success|solutions? (engineer|consultant|architect)|pre-?sales|field|business|operations|program manager|product manager|project manager|designer|design|content|writer|mechanical|civil|electrical|hardware|analog|asic|rtl|rf|silicon|physical design|verification|manufacturing|quality assurance technician|technician|construction|nurse|clinical|pharma\w*|teacher|tutor|professional services|implementation|consultant|salesforce|sap|servicenow developer|admin|administrator|people systems|it support|helpdesk|ux|user research\w*)\b/i
const SENIOR =
  /\b(senior|sr\.?|staff|principal|lead|leader|manager|mgr|mgmt|management|director|dir\.?|head|intermediate|mid[- ]?level|experienced|architect|vp|vice president|chief|distinguished|expert|specialist ii|(engineer|developer|sde|swe|scientist)\s*[-–]?\s*(ii|iii|iv|2|3|4)|(ii|iii|iv)$|l[4-9]|e[4-9]|mts\s*(2|3|ii|iii)|smts|lmts|pmts)\b/i
const INTERN = /\b(intern(ship)?|co-?op|apprentice(ship)?|trainee|summer analyst|industrial training)\b/i
const NEW_GRAD =
  /\b(new grad\w*|graduate|university|campus|early career|entry[- ]level|fresher|freshers|junior|jr\.?|associate (software|engineer|developer)|(sde|swe|engineer|developer)\s*[-–]?\s*(i|1)\b|level 1|grad(uate)? program|class of 2027|2027)\b/i
const PAST_INTAKE = /\b20(1\d|2[0-6])\b/
const EXPERIENCE =
  /(\d{1,2})\s*(?:\+|plus)?\s*(?:-|–|to)?\s*(?:\d{1,2})?\s*\+?\s*years?(?:'|’)?\s*(?:of)?\s*(?:[\w-]+\s){0,6}?(?:experience|exp\b)/gi
const NO_SPONSOR =
  /(not (able|going) to (offer|provide) (visa )?sponsorship|unable to (offer|provide)? ?sponsor|no (visa )?sponsorship|without (the need for )?(visa )?sponsorship|(do(es)? not|don't|cannot|can't|won't|will not|are not able to) (currently )?(offer|provide|support|sponsor)( any)? ?(visa|work permit|sponsorship)?|not (currently )?(offer|provid)(ing|e)? (visa )?sponsorship|must be (legally )?authori[sz]ed to work|must (already )?have (the )?(right|authori[sz]ation) to work|u\.?s\.? citizen(ship)?|security clearance|green card|permanent resident|eu (citizen|passport)|eligible to work in the (eu|uk|us))/i
const SPONSOR =
  /(visa sponsorship (is |will be )?(available|provided|offered|possible)|we (will|can|do|are able to|are happy to) sponsor|sponsor(ing)? (your |the |work )?visas?|sponsorship (is )?available|offer(s|ing)? (visa )?sponsorship|provide (visa )?sponsorship|visa support|work permit (support|sponsorship))/i
const RELOCATION =
  /(relocation (support|assistance|package|bonus|budget|allowance|help)|help (you )?(with )?relocat|support (your |you with |with )?relocat|relocate to (our|the|one of)|we('ll| will) (help|support)[^.]{0,40}relocat)/i

const HYDERABAD = /\b(hyderabad|secunderabad|hitec city|gachibowli)\b/i
const INDIA =
  /\b(india|bengaluru|bangalore|pune|gurugram|gurgaon|chennai|mumbai|noida|new delhi|delhi|ncr|kolkata|ahmedabad|kochi|cochin|trivandrum|thiruvananthapuram|jaipur|chandigarh|coimbatore|indore|mysuru|mysore|vizag|visakhapatnam|bhubaneswar)\b/i
const REMOTE = /\b(remote|anywhere|work from home|wfh|distributed)\b/i
const REMOTE_GLOBAL = /\b(anywhere|worldwide|global(ly)?|any (country|timezone|location)|apac|asia)\b/i
const REMOTE_ELSEWHERE =
  /\b(us|u\.s\.|usa|united states|canada|uk|united kingdom|europe|eu|eea|emea|americas|latam|north america|germany|france|netherlands|spain|poland|australia|brazil|mexico|est|pst|cet|pt|et|us hours|us time\w*)\b/i
/** What's left of a location once remote words and punctuation are removed: empty means "Remote" with no place. */
const placeLeft = (location: string) =>
  location
    .replace(
      /\b(remote|fully|100%|work from home|wfh|distributed|hybrid|onsite|on-site|not stated|first|friendly|only)\b/gi,
      '',
    )
    .replace(/[\s,;:()\-–|/%]+/g, '')

/** The smallest "N years" of experience a description asks for, if it says. */
export function minYears(text: string | undefined): number | undefined {
  if (!text) return undefined
  let min: number | undefined
  for (const m of text.matchAll(EXPERIENCE)) {
    const n = Number(m[1])
    if (n <= 15 && (min === undefined || n < min)) min = n
  }
  return min
}

export function regionOf(location: string, remote?: boolean): Region | 'remote-elsewhere' {
  if (HYDERABAD.test(location)) return 'hyderabad'
  if (INDIA.test(location)) return 'india'
  if (remote || REMOTE.test(location)) {
    if (REMOTE_GLOBAL.test(location)) return 'remote'
    // "Remote" on its own is open; "Remote, Canada" or a remote flag on "New York; San Francisco" is not.
    if (!REMOTE_ELSEWHERE.test(location) && placeLeft(location) === '') return 'remote'
    return 'remote-elsewhere'
  }
  return 'international'
}

export function categoryOf(title: string): string {
  if (
    /machine learning|\bml\b|\bai\b|artificial intelligence|data scien|deep learning|nlp|computer vision|llm|gen ?ai|applied scien|research (engineer|scientist)/i.test(
      title,
    )
  )
    return 'ML / AI'
  if (/data engineer|analytics engineer|big data/i.test(title)) return 'Data'
  if (/android|ios|mobile|flutter|react native/i.test(title)) return 'Mobile'
  if (/front[- ]?end|\bui\b|web developer/i.test(title)) return 'Frontend'
  if (/full[- ]?stack/i.test(title)) return 'Full-stack'
  if (/devops|\bsre\b|site reliability|infrastructure|platform|cloud|security/i.test(title)) return 'Infra'
  if (/back[- ]?end|server|distributed|api/i.test(title)) return 'Backend'
  return 'SDE'
}

export function classify(p: RawPosting, now = new Date()): Classified {
  const title = p.title
  const text = `${title}\n${p.description ?? ''}`

  if (!TECH.test(title) || NOT_TECH.test(title)) return { keep: false, reason: 'not an engineering role' }
  if (SENIOR.test(title)) return { keep: false, reason: 'senior role' }
  if (/\b(ph\.?\s?d|doctoral|postdoc\w*|mba)\b/i.test(title)) return { keep: false, reason: 'needs a PhD or MBA' }

  const yearsInTitle = title.match(PAST_INTAKE)
  if (yearsInTitle && !/2027|2028/.test(title)) return { keep: false, reason: 'past intake' }

  if (p.postedAt && now.getTime() - p.postedAt.getTime() > 45 * 24 * 60 * 60 * 1000) {
    return { keep: false, reason: 'older than 45 days' }
  }

  // Level
  const hint = p.hints?.level ?? ''
  const years = minYears(p.description)
  let level: Level
  if (INTERN.test(title) || /intern/i.test(hint) || /intern/i.test(p.hints?.employmentType ?? '')) level = 'intern'
  else if (NEW_GRAD.test(title) || /new grad|entry/i.test(hint)) level = 'new-grad'
  else if (/mid|senior|director|executive/i.test(hint)) return { keep: false, reason: 'senior role' }
  else if (years !== undefined && years >= 2) return { keep: false, reason: `asks for ${years}+ years` }
  else if (years !== undefined) level = 'entry'
  else level = 'unspecified'

  // Sources full of senior roles (HN) must say intern / junior / new grad somewhere.
  if (p.hints?.strictLevel) {
    if (level === 'unspecified' || level === 'entry') {
      if (/\b(intern(ship)?s?)\b/i.test(text)) level = 'intern'
      else if (/\b(new grads?|junior|entry[- ]level|fresh(er|ers| grad\w*))\b/i.test(text)) level = 'new-grad'
      else return { keep: false, reason: 'level not stated' }
    }
    if (/no longer (taking|accepting)|position (has been )?filled|\bfilled\b|\bclosed\b/i.test(text))
      return { keep: false, reason: 'closed' }
  }

  if (level !== 'intern' && years !== undefined && years >= 2)
    return { keep: false, reason: `asks for ${years}+ years` }

  // Where, and whether the work authorisation rules allow it
  const flags: string[] = []
  const where = regionOf(p.location, p.remote)
  const sponsorHint = p.hints?.sponsorship ?? ''
  const sponsors = SPONSOR.test(text) || /offers sponsorship/i.test(sponsorHint)
  const blocks = NO_SPONSOR.test(text) || /does not offer|citizenship/i.test(sponsorHint)

  if (where === 'international' || where === 'remote-elsewhere') {
    // Internships abroad need enrolment or a visa in that country; a student in India can't take them.
    if (level === 'intern') return { keep: false, reason: 'internship abroad' }
    if (blocks) return { keep: false, reason: 'abroad, needs existing work rights' }
    // Abroad only when the company says it sponsors a visa or helps you relocate.
    const relocates = RELOCATION.test(text)
    if (!sponsors && !relocates) return { keep: false, reason: 'abroad without visa or relocation support' }
    // A role with no stated level abroad is kept only when it explicitly sponsors a visa.
    if (level === 'unspecified' && !sponsors) return { keep: false, reason: 'abroad, level not stated' }
    if (sponsors) flags.push('Visa sponsorship offered')
    if (relocates) flags.push('Relocation support')
  } else if (where === 'remote' && blocks) {
    return { keep: false, reason: 'requires local work authorisation' }
  }
  const region: Region = where === 'remote-elsewhere' ? 'international' : where

  if (level === 'unspecified') flags.push('Experience not stated')
  return { keep: true, level, region, category: categoryOf(title), flags }
}

/**
 * Cheap check on title and location only, before downloading a description.
 * True when the posting could still pass `classify` once its description is known.
 */
export function worthDetail(p: Pick<RawPosting, 'title' | 'location' | 'remote'>): boolean {
  const title = p.title
  if (!TECH.test(title) || NOT_TECH.test(title) || SENIOR.test(title)) return false
  const yearsInTitle = title.match(PAST_INTAKE)
  if (yearsInTitle && !/2027|2028/.test(title)) return false
  const where = regionOf(p.location, p.remote)
  // Abroad: download the description to look for visa or relocation support (internships abroad never qualify).
  if (where === 'international' || where === 'remote-elsewhere') return !INTERN.test(title)
  return true
}
