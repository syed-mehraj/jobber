import { newId } from '../paths'
import {
  toContent,
  type Bullet,
  type CertificationItem,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type ResumeContent,
  type SectionKey,
  type SkillGroup,
} from '../types'

/*
 * Resume upload, step 2: heuristic parser from plain resume text (as extracted from a PDF, Word or text file, one
 * visual line per text line) to the app's structured content. Pure, never throws, and always returns content that
 * passes `toContent`. It copies the person's own wording; it never rewrites or invents anything.
 *
 * Section headings (any case, optional trailing ":" or decoration) map like this:
 *   summary         summary, professional/career summary, profile, objective, career objective, about me, ...
 *   experience      experience, work/professional/industry/relevant/internship/research experience, employment,
 *                   work history, internships
 *   projects        projects, personal/academic/technical/key/selected/side projects
 *   education       education, academics, academic background/qualifications, qualifications
 *   skills          skills, technical/core/key skills, technologies, tech stack, core competencies, tools and technologies
 *   certifications  certifications, certificates, courses, licenses and certifications, online courses
 *   custom          awards, achievements, honors, leadership, volunteering, extracurriculars, interests, publications,
 *                   open source, hackathons, ... and (in ALL CAPS résumés) any other short ALL CAPS heading.
 *                   The app has ONE custom section: the first such section gives it its title; when there are several,
 *                   the title becomes "Additional" and each bullet is prefixed with its section name.
 *   (skipped)       personal details, personal information, declaration, references: never imported (privacy)
 * Phone numbers and street addresses are never stored.
 */

type Section = 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'certifications' | 'custom'
type HeadingKind = Section | 'skip'

const SECTION_ORDER: SectionKey[] = [
  'contact',
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
  'custom',
]

/* ------------------------------------------------------------------ small helpers */

const words = (s: string) => s.split(/\s+/).filter(Boolean)
const DASHES = '\\-\\u2010-\\u2015\\u2212'

function makeIds() {
  const used = new Set<string>()
  return (prefix: string) => {
    let id = newId(prefix)
    while (used.has(id)) id = newId(prefix)
    used.add(id)
    return id
  }
}

/** Trims stray separators left behind after pieces were cut out of a line. */
function tidy(s: string): string {
  return s
    .replace(/\(\s*\)|\[\s*\]/g, ' ')
    .replace(/\s*[|•·]\s*(?:[|•·]\s*)+/g, ' | ')
    .replace(new RegExp(`^[\\s|\\u2022\\u00b7,;:${DASHES}]+|[\\s|\\u2022\\u00b7,;:${DASHES}(]+$`, 'g'), '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Removes phone numbers (and their "Phone:" labels). Used on every line and again on the finished content. */
const PHONE_LABEL =
  /\b(?:phone|mobile|mob|tel|telephone|cell|ph|contact)\s*(?:no\.?|number|#)?\s*[:.\-–]?\s*(?=[+(\d])/gi
const PHONE_RE = /(?<![\w@/])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d(?:[\s.-]?\d){5,13}(?![\w])/g
export function stripPhones(s: string): string {
  let out = s.replace(/\b(?:tel|mailto):/gi, '').replace(PHONE_LABEL, '')
  out = out.replace(PHONE_RE, (m) => {
    const digits = m.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) return m
    if (/^(?:(?:19|20)\d{2}[\s.-]*)+$/.test(m)) return m // only years, such as "2021 2022 2023"
    return ' '
  })
  return out === s ? s : tidy(out)
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/\b(And|Of|The|In|For)\b(?!$)/g, (m, _w: string, off: number) => (off === 0 ? m : m.toLowerCase()))
}

const BULLET_RE = /^\s*(?:[•●◦▪▫■□►▸▶‣∙·-]\s*|(?:[*–—-]|\d{1,2}[.)])\s+)/

/** The text of a bullet line without its glyph, or null when the line is not a bullet. */
function bulletText(line: string): string | null {
  const m = BULLET_RE.exec(line)
  if (!m) return null
  return line.slice(m[0].length).trim()
}

/* ------------------------------------------------------------------ dates */

const MONTH =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const YEAR = '(?:19|20)\\d{2}'
const D1 =
  `(?:(?:expected\\s*(?:in\\s*|by\\s*)?|exp\\.?\\s*)?(?:${MONTH}\\b\\.?,?\\s*['’]?(?:${YEAR}|\\d{2}(?!\\d))` +
  `|\\d{1,2}[/.]${YEAR}|(?:summer|winter|spring|fall|autumn)\\s*${YEAR}|${YEAR}))`
const NOW = '(?:present|current|currently|ongoing|now|till\\s+date|to\\s+date|today)'
const SEP = `(?:[${DASHES}]|\\bto\\b|\\buntil\\b|\\btill\\b)`
const RANGE = new RegExp(`(?<![\\w/])\\(?\\s*(${D1})\\s*${SEP}\\s*(${D1}|${NOW}\\b|\\d{2}(?![\\d%]))\\s*\\)?`, 'i')
const END_SINGLE = new RegExp(`(?<![\\w/])\\(?\\s*(${D1})\\s*\\)?\\s*$`, 'i')
const START_SINGLE = new RegExp(`^\\s*\\(?\\s*(${D1})\\s*\\)?(?![\\w/])`, 'i')

type Dates = { rest: string; start: string; end: string; range: boolean; found: boolean }

/** Pulls a date range ("Jul 2026 - Present", "2023 - 2027", "06/2024 - 08/2024") or one date out of a line. */
function takeDates(line: string): Dates {
  let m = RANGE.exec(line)
  if (m) {
    const start = m[1].trim()
    let end = m[2].trim()
    if (/^\d{2}$/.test(end)) end = `${(/(?:19|20)\d{2}/.exec(start)?.[0] ?? '20').slice(0, 2)}${end}`
    return {
      rest: `${line.slice(0, m.index)} ${line.slice(m.index + m[0].length)}`,
      start,
      end,
      range: true,
      found: true,
    }
  }
  m = END_SINGLE.exec(line) ?? START_SINGLE.exec(line)
  if (m) {
    return {
      rest: `${line.slice(0, m.index)} ${line.slice(m.index + m[0].length)}`,
      start: m[1].trim(),
      end: '',
      range: false,
      found: true,
    }
  }
  return { rest: line, start: '', end: '', range: false, found: false }
}

const hasDate = (line: string) => takeDates(line).found

/* ------------------------------------------------------------------ places, roles, schools */

const PLACES = new Set(
  (
    'india,usa,us,u.s.,u.s.a.,united states,united states of america,uk,u.k.,united kingdom,england,scotland,wales,ireland,canada,australia,' +
    'new zealand,germany,france,netherlands,spain,italy,sweden,norway,denmark,finland,switzerland,singapore,uae,united arab emirates,dubai,' +
    'abu dhabi,qatar,saudi arabia,japan,china,hong kong,south korea,malaysia,indonesia,philippines,vietnam,thailand,pakistan,bangladesh,' +
    'sri lanka,nepal,brazil,mexico,south africa,nigeria,kenya,egypt,israel,poland,portugal,remote,hybrid,' +
    'hyderabad,secunderabad,bengaluru,bangalore,mumbai,navi mumbai,thane,delhi,new delhi,noida,greater noida,gurgaon,gurugram,faridabad,ghaziabad,' +
    'chennai,pune,kolkata,ahmedabad,surat,vadodara,jaipur,jodhpur,udaipur,kochi,cochin,thiruvananthapuram,trivandrum,coimbatore,madurai,' +
    'vijayawada,visakhapatnam,vizag,guntur,tirupati,warangal,karimnagar,nizamabad,indore,bhopal,nagpur,nashik,lucknow,kanpur,varanasi,patna,' +
    'ranchi,bhubaneswar,cuttack,guwahati,chandigarh,mohali,dehradun,amritsar,ludhiana,mysore,mysuru,mangalore,mangaluru,hubli,belgaum,goa,' +
    'telangana,andhra pradesh,karnataka,tamil nadu,kerala,maharashtra,gujarat,rajasthan,uttar pradesh,madhya pradesh,west bengal,odisha,bihar,' +
    'punjab,haryana,jharkhand,assam,uttarakhand,himachal pradesh,' +
    'san francisco,san jose,san diego,los angeles,seattle,portland,austin,dallas,houston,boston,cambridge,new york,new york city,nyc,brooklyn,' +
    'chicago,atlanta,miami,denver,phoenix,philadelphia,pittsburgh,washington,washington dc,san mateo,mountain view,palo alto,sunnyvale,' +
    'redmond,bellevue,raleigh,charlotte,columbus,detroit,minneapolis,toronto,vancouver,montreal,ottawa,calgary,waterloo,london,manchester,' +
    'edinburgh,birmingham,cambridge,dublin,berlin,munich,hamburg,paris,amsterdam,zurich,stockholm,copenhagen,oslo,helsinki,madrid,barcelona,' +
    'milan,rome,tokyo,osaka,beijing,shanghai,shenzhen,seoul,kuala lumpur,jakarta,manila,bangkok,sydney,melbourne,brisbane,perth,auckland,' +
    'tel aviv,cairo,lagos,nairobi,cape town,johannesburg,karachi,lahore,islamabad,dhaka,colombo,kathmandu,sao paulo,mexico city,riyadh,doha'
  ).split(','),
)
const US_STATE =
  /^(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)$/

/** Best effort: "Hyderabad, India", "Austin, TX", "Remote". Street addresses are never accepted. */
function isLocation(s: string): boolean {
  const t = s
    .replace(/\b\d{5,6}\b/g, '')
    .replace(/[\s,]+$/, '')
    .trim()
  if (!t || /[@\d|]/.test(t) || t.length > 50) return false
  const pieces = t
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (pieces.length === 0 || pieces.length > 4) return false
  if (pieces.some((p) => words(p).length > 3 || !/^[\p{L}.' -]+$/u.test(p))) return false
  if (pieces.length === 2 && US_STATE.test(pieces[1]) && words(pieces[0]).length <= 2 && !looksLikeRole(pieces[0]))
    return true
  return pieces.every((p) => PLACES.has(p.toLowerCase().replace(/\s+/g, ' ')))
    ? true
    : pieces.length > 1 &&
        PLACES.has(pieces[pieces.length - 1].toLowerCase()) &&
        pieces.slice(0, -1).every((p) => words(p).length <= 2 && !looksLikeRole(p) && !hasCompanyWord(p))
}

const ROLE_WORDS = new Set(
  (
    'intern,interns,internship,trainee,engineer,developer,analyst,manager,designer,consultant,associate,lead,scientist,researcher,assistant,' +
    'director,architect,administrator,specialist,officer,head,founder,cofounder,co-founder,member,volunteer,fellow,tester,executive,sde,swe,' +
    'programmer,student,coordinator,representative,instructor,tutor,mentor,ambassador,president,secretary,captain,apprentice,freelancer,' +
    'freelance,contractor,technician,sde1,sde2,sde-1,sde-2,teacher,ta,engineering,development'
  ).split(','),
)
function looksLikeRole(s: string): boolean {
  return words(s.toLowerCase().replace(/[(),.]/g, ' ')).some((w) => ROLE_WORDS.has(w))
}
const COMPANY_RE =
  /\b(?:inc|llc|ltd|pvt|private|limited|technologies|technology|labs|solutions|systems|corp|corporation|company|services|studios|group|foundation|consulting|enterprises|ventures|networks|analytics|bank|university|institute|college)\b\.?|&/i
const hasCompanyWord = (s: string) => COMPANY_RE.test(s)

const SCHOOL_RE =
  /\b(?:university|college|institute|institution|school|academy|iit|nit|iiit|iim|bits|polytechnic|vidyalaya|vidyapeeth|campus|jntu\w*|mjcet|gurukul|mahavidyalaya|faculty)\b/i
const DEGREE_RE =
  /\b(?:b\.\s?tech|m\.\s?tech|btech|mtech|b\.\s?e|m\.\s?e|b\.\s?sc|m\.\s?sc|bsc|msc|b\.\s?com|m\.\s?com|bcom|b\.\s?a|m\.\s?a|bca|mca|bba|mba|ph\.?\s?d|bachelors?|masters?|diploma|degree|intermediate|secondary|ssc|hsc|cbse|icse|isc|class\s*(?:x|xi|xii|10|12)(?:th)?|(?:10|12)(?:th)?\s*(?:grade|std|standard|class)?|mpc|bipc|b\.\s?s|m\.\s?s|associate\s+of)\b/i
const DEGREE_CASE_RE = /\b(?:BE|ME|BS|MS|BA|MA|BSc|MSc|BTech|MTech|XII|XI|X)\b/

const isSchool = (s: string) => SCHOOL_RE.test(s)
const isDegree = (s: string) => DEGREE_RE.test(s) || DEGREE_CASE_RE.test(s)

const TECH_WORDS = new RegExp(
  '(?:^|[^\\p{L}\\d])(?:python|java|javascript|typescript|react(?:\\.?js| native)?|node(?:\\.?js)?|next\\.?js|express|flask|django|fastapi|spring(?: boot)?|sql|mysql|postgres(?:ql)?|mongodb|sqlite|redis|aws|azure|gcp|docker|kubernetes|tensorflow|pytorch|keras|scikit-learn|sklearn|pandas|numpy|opencv|html5?|css3?|tailwind(?:css)?|bootstrap|firebase|supabase|kotlin|flutter|dart|git|github|linux|c\\+\\+|c#|rust|golang|swift|android|streamlit|langchain|openai|gemini|llama|hugging ?face|angular|vue(?:\\.?js)?|svelte|php|laravel|ruby|rails|graphql|rest(?:ful)? apis?|opencv|matlab|r|c|go|figma|jwt|nlp|rag)(?=$|[^\\p{L}\\d+#])',
  'iu',
)
function looksTech(s: string): boolean {
  if (/[.!?]$/.test(s.trim()) && words(s).length > 8) return false
  if (TECH_WORDS.test(s) && words(s).length <= 14) return true
  const items = s
    .split(/[,;|]/)
    .map((x) => x.trim())
    .filter(Boolean)
  return items.length >= 3 && items.every((x) => words(x).length <= 3)
}

/* ------------------------------------------------------------------ headings */

const HEADING_WORDS: Record<string, HeadingKind> = {}
const addHeadings = (kind: HeadingKind, list: string[]) => list.forEach((h) => (HEADING_WORDS[h] = kind))
addHeadings('summary', [
  'summary',
  'professional summary',
  'career summary',
  'executive summary',
  'summary of qualifications',
  'profile',
  'professional profile',
  'personal profile',
  'objective',
  'career objective',
  'professional objective',
  'about me',
  'about',
  'personal statement',
])
addHeadings('experience', [
  'experience',
  'work experience',
  'professional experience',
  'industry experience',
  'relevant experience',
  'internship experience',
  'research experience',
  'employment',
  'employment history',
  'work history',
  'internships',
  'internship',
  'career history',
])
addHeadings('projects', [
  'projects',
  'personal projects',
  'academic projects',
  'key projects',
  'selected projects',
  'side projects',
  'technical projects',
  'notable projects',
  'project experience',
  'project work',
  'projects and open source',
])
addHeadings('education', [
  'education',
  'academics',
  'academic background',
  'academic qualifications',
  'educational qualifications',
  'education and training',
  'qualifications',
  'education details',
])
addHeadings('skills', [
  'skills',
  'technical skills',
  'core skills',
  'key skills',
  'technologies',
  'tech stack',
  'skills and tools',
  'tools and technologies',
  'technical proficiencies',
  'core competencies',
  'competencies',
  'technical expertise',
  'areas of expertise',
])
addHeadings('certifications', [
  'certifications',
  'certification',
  'certificates',
  'courses',
  'licenses and certifications',
  'licenses',
  'certifications and courses',
  'certifications and licenses',
  'online courses',
  'training and certifications',
  'courses and certifications',
])
addHeadings('custom', [
  'awards',
  'achievements',
  'accomplishments',
  'awards and achievements',
  'achievements and awards',
  'honors',
  'honours',
  'honors and awards',
  'awards and honors',
  'leadership',
  'leadership experience',
  'leadership and activities',
  'volunteering',
  'volunteer experience',
  'volunteer work',
  'extracurricular',
  'extracurriculars',
  'extracurricular activities',
  'extra-curricular activities',
  'extra curricular activities',
  'co-curricular activities',
  'activities',
  'positions of responsibility',
  'responsibilities',
  'interests',
  'hobbies',
  'hobbies and interests',
  'publications',
  'research',
  'open source',
  'open source contributions',
  'hackathons',
  'competitions',
  'patents',
  'talks',
  'community',
  'community involvement',
  'clubs and societies',
  'additional information',
  'additional',
  'training',
  'trainings',
  'coursework',
  'relevant coursework',
  'languages known',
  'spoken languages',
])
addHeadings('skip', ['personal details', 'personal information', 'personal data', 'declaration', 'references'])

type Heading = { kind: HeadingKind; title: string; known: boolean; inline?: string }

function normaliseHeading(line: string): string | null {
  if (bulletText(line) !== null) return null
  const t = line.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
  if (!t || t.length > 50 || /[@|]/.test(t) || /\d/.test(t) || words(t).length > 5) return null
  return t
    .toLowerCase()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
}

/** A heading from the dictionaries (exact, or "... Skills" style), or null. ALL CAPS unknowns are handled separately. */
function knownHeading(line: string, current: HeadingKind | null): Heading | null {
  // "Objective: To obtain..." and "Skills: Python, Java" carry their content on the heading line.
  const inline = /^([^:]{3,30}):\s*(\S.*)$/.exec(line)
  if (inline) {
    const label = normaliseHeading(inline[1])
    const kind = label ? HEADING_WORDS[label] : undefined
    if (kind === 'summary' || (kind === 'skills' && label !== 'competencies'))
      return { kind, title: inline[1].trim(), known: true, inline: inline[2].trim() }
  }
  const label = normaliseHeading(line)
  if (!label) return null
  const ends = /:\s*$/.test(line)
  const exact = HEADING_WORDS[label]
  if (exact) {
    // "Courses:" or "Research:" alone inside skills are sub-labels, not headings.
    if (exact === 'custom' && ends && current === 'skills') return null
    return { kind: exact, title: titleCase(label), known: true }
  }
  const ws = words(label)
  const last = ws[ws.length - 1]
  const byLast: Record<string, HeadingKind> = {
    skills: 'skills',
    experience: 'experience',
    projects: 'projects',
    education: 'education',
    certifications: 'certifications',
    certificates: 'certifications',
    summary: 'summary',
    awards: 'custom',
    achievements: 'custom',
    activities: 'custom',
  }
  if (ws.length <= 4 && ws.length > 1 && byLast[last]) {
    const isCaps = line === line.toUpperCase()
    if (isCaps || ends || ws.length <= 3) return { kind: byLast[last], title: titleCase(label), known: true }
  }
  return null
}

const isAllCaps = (s: string) => /\p{L}/u.test(s) && s === s.toUpperCase()

/* ------------------------------------------------------------------ contact */

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[\w\-%.]+\/?/gi
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+(?:\/[\w.-]+)*\/?/gi
const WEBSITE_RE =
  /(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|io|dev|me|app|co|in|net|org|tech|ai|xyz|site|online|page|codes|vercel\.app|netlify\.app|github\.io)\b(?:\/[^\s|,;]*)?/gi

export function cleanUrl(u: string): string {
  return u
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/[/.,;)\]]+$/, '')
}
/** github.com/name/repo -> github.com/name */
export function githubUser(u: string): string {
  const parts = cleanUrl(u).split('/')
  return `${parts[0]}/${parts[1] ?? ''}`.replace(/\/$/, '')
}

const LABEL_ONLY =
  /^(?:e-?mail|mail|linkedin|github|git hub|portfolio|website|web|site|url|address|location|phone|mobile|contact|links?|profile|profiles)$/i
const ROLE_NOT_NAME = /^(?:resume|résumé|curriculum|vitae|cv|page|profile|summary|contact|address)$/i

function looksLikeName(s: string): boolean {
  const ws = words(s)
  if (ws.length < 2 || ws.length > 5) return false
  if (!ws.every((w) => /^\p{L}[\p{L}.'’-]*$/u.test(w) && w.length <= 20)) return false
  if (ws.some((w) => ROLE_NOT_NAME.test(w)) || looksLikeRole(s)) return false
  if (normaliseHeading(s) && HEADING_WORDS[normaliseHeading(s)!]) return false
  return !isLocation(s)
}

const ADDRESS_WORDS =
  /\b(?:road|rd|street|st|nagar|colony|flat|plot|apt|apartment|lane|ave|avenue|block|sector|near|pin|pincode|zip|house|h\.?\s?no|door|villa|layout|cross)\b/i

type Contact = {
  name: string
  title: string
  location: string
  email: string
  github: string
  linkedin: string
  website: string
}

function parseHeader(lines: string[]): { contact: Contact; leftover: string[] } {
  const c: Contact = { name: '', title: '', location: '', email: '', github: '', linkedin: '', website: '' }
  const leftover: string[] = []
  let nameLine = -1
  lines.forEach((raw, idx) => {
    let rest = stripPhones(raw)
    const email = rest.match(EMAIL_RE)
    if (email) {
      if (!c.email) c.email = email[0]
      rest = rest.replace(EMAIL_RE, ' ')
    }
    const li = rest.match(LINKEDIN_RE)
    if (li) {
      if (!c.linkedin) c.linkedin = cleanUrl(li[0])
      rest = rest.replace(LINKEDIN_RE, ' ')
    }
    const gh = rest.match(GITHUB_RE)
    if (gh) {
      if (!c.github) c.github = githubUser(gh[0])
      rest = rest.replace(GITHUB_RE, ' ')
    }
    const web = rest.match(WEBSITE_RE)
    if (web) {
      if (!c.website) c.website = cleanUrl(web[0])
      rest = rest.replace(WEBSITE_RE, ' ')
    }
    rest = rest.replace(
      /\b(?:e-?mail|mail|linkedin|github|portfolio|website|web|site|url|address|location|phone|mobile)\s*:/gi,
      ' ',
    )
    const segs = rest
      .split(new RegExp(`\\s*[|\\u2022\\u25cf\\u00b7\\u25aa]\\s*|\\s+[${DASHES}]\\s+|\\s{3,}`))
      .map((s) => tidy(s))
      .filter(Boolean)
    for (const seg of segs) {
      if (LABEL_ONLY.test(seg)) continue
      if (!c.location && isLocation(seg)) {
        c.location = seg
          .replace(/\b\d{5,6}\b/g, '')
          .replace(/[\s,]+$/, '')
          .trim()
        continue
      }
      if (!c.name && looksLikeName(seg)) {
        c.name = seg
        nameLine = idx
        continue
      }
      if (/\d/.test(seg) && (ADDRESS_WORDS.test(seg) || /\d{5,}/.test(seg) || /^\d/.test(seg))) continue // addresses are never kept
      if (
        c.name &&
        !c.title &&
        idx - nameLine <= 2 &&
        words(seg).length <= 8 &&
        !/\d|[.!?]$/.test(seg) &&
        !bulletText(seg)
      ) {
        c.title = seg
        continue
      }
      leftover.push(seg)
    }
  })
  return { contact: c, leftover }
}

/* ------------------------------------------------------------------ entries (experience, projects, education) */

type Hooks<T extends { bullets: Bullet[] }> = {
  newItem(): T
  /** A non-bullet line that adds to the current entry's header (only while it has no bullets). */
  isContinuation(item: T, line: string): boolean
  header(item: T, line: string, first: boolean): void
  /** Lines that are neither header nor bullet, such as "Tech: Python". Returns true when handled. */
  special?(item: T | undefined, text: string, wasBullet: boolean): boolean
  /** Entry-looking line? Used to tell a new entry from a wrapped bullet. */
  newEntryLike?(line: string): boolean
}

const splitHeaderParts = (s: string): string[] =>
  s
    .split(new RegExp(`\\s*\\|\\s*|\\s*[\\u2013\\u2014\\u2015]\\s*|\\s+-\\s+|\\s+\\u2022\\s+`))
    .map((p) => tidy(p))
    .filter(Boolean)

const sentenceLike = (line: string) => words(line).length >= 8 || (/[.!?]$/.test(line) && words(line).length >= 4)

/** A description written without a bullet glyph: long, or a short sentence that ends with a full stop. */
const descriptionLike = (line: string) =>
  !hasDate(line) &&
  (words(line).length >= 8 || (/[.!?]$/.test(line) && words(line).length >= 2 && !COMPANY_RE.test(line)))

function genericNewEntryLike(line: string): boolean {
  if (hasDate(line)) return true
  if (splitHeaderParts(line).length >= 2) return true
  const ws = words(line)
  if (ws.length <= 4 && ws.every((w) => /^[\p{Lu}\d(&]/u.test(w))) return !/[,;]$/.test(line)
  return false
}

function runEntries<T extends { bullets: Bullet[] }>(
  lines: string[],
  newBullet: (t: string) => Bullet,
  h: Hooks<T>,
): T[] {
  const items: T[] = []
  let cur: T | undefined
  let afterBlank = false
  let lastWasBullet = false
  const addBullet = (text: string) => {
    if (!cur) {
      cur = h.newItem()
      items.push(cur)
    }
    cur.bullets.push(newBullet(text))
    lastWasBullet = true
  }
  for (const line of lines) {
    if (!line) {
      afterBlank = true
      continue
    }
    const bt = bulletText(line)
    if (bt !== null) {
      afterBlank = false
      if (bt && !h.special?.(cur, bt, true)) addBullet(bt)
      continue
    }
    if (h.special?.(cur, line, false)) {
      afterBlank = false
      lastWasBullet = false
      continue
    }
    if (cur && cur.bullets.length > 0 && lastWasBullet) {
      const prev = cur.bullets[cur.bullets.length - 1]
      const unfinished = !/[.!?]["')\]]?$/.test(prev.text)
      const wrapped =
        /^[a-z(\[]/.test(line) ||
        // A line that starts with a number or symbol right after an unfinished sentence ("…tags were preserved" /
        // "100% of the time") is the same bullet wrapping, not a new one.
        (unfinished && !afterBlank && /^[\d%$€₹£+~]/.test(line) && !hasDate(line)) ||
        (!afterBlank &&
          !(h.newEntryLike ?? genericNewEntryLike)(line) &&
          !/[.!?]["')\]]?$/.test(prev.text) &&
          !sentenceLike(line))
      if (wrapped) {
        prev.text = `${prev.text} ${line}`
        afterBlank = false
        continue
      }
      if (sentenceLike(line) && !hasDate(line) && /[.!?]["')\]]?$/.test(prev.text) && words(line).length >= 8) {
        afterBlank = false
        addBullet(line)
        continue
      }
    }
    afterBlank = false
    if (cur && descriptionLike(line)) {
      addBullet(line)
      continue
    }
    if (cur && cur.bullets.length === 0 && h.isContinuation(cur, line)) {
      h.header(cur, line, false)
      continue
    }
    cur = h.newItem()
    items.push(cur)
    lastWasBullet = false
    h.header(cur, line, true)
  }
  return items
}

/* experience */

function roleScore(s: string) {
  return (looksLikeRole(s) ? 2 : 0) - (hasCompanyWord(s) ? 1 : 0)
}

function parseLineParts(text: string): { parts: string[]; roleFirst?: boolean; location: string } {
  let location = ''
  let t = text
  let roleFirst: boolean | undefined
  const atMatch = / (?:at|@) /i.exec(t)
  let parts: string[]
  if (atMatch && t.split(/ (?:at|@) /i).length === 2 && !/[|–—]/.test(t)) {
    parts = t
      .split(/ (?:at|@) /i)
      .map(tidy)
      .filter(Boolean)
    roleFirst = true
  } else {
    parts = splitHeaderParts(t)
    if (parts.length <= 1) {
      // Comma form: "Role, Company, City, Country"
      const pieces = t
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      for (const n of [2, 1]) {
        if (pieces.length > n && isLocation(pieces.slice(-n).join(', '))) {
          location = pieces.slice(-n).join(', ')
          pieces.splice(-n, n)
          // "Parallel Labs (Parcera) Hyderabad, India": the city sits at the end of the company piece.
          const last = pieces[pieces.length - 1] ?? ''
          const m = /\s([\p{Lu}][\p{L}.'-]+)$/u.exec(last)
          if (m && PLACES.has(m[1].toLowerCase()) && last.length > m[0].length) {
            pieces[pieces.length - 1] = last.slice(0, -m[0].length).trim()
            location = `${m[1]}, ${location}`
          }
          break
        }
      }
      if (pieces.length >= 2) {
        parts = [pieces[0], pieces.slice(1).join(', ')]
        roleFirst = true
      } else parts = pieces
      t = ''
    }
  }
  const kept: string[] = []
  for (const p of parts) {
    if (!location && parts.length >= 2 && isLocation(p)) location = p
    else kept.push(p)
  }
  return { parts: kept, roleFirst, location }
}

function expAssign(it: ExperienceItem, text: string) {
  const { parts, roleFirst, location } = parseLineParts(text)
  if (location && !it.location) it.location = location
  if (parts.length === 0) return
  if (parts.length === 1) {
    const p = parts[0]
    if (it.role && !it.company) it.company = p
    else if (it.company && !it.role) it.role = p
    else if (!it.role && !it.company) {
      if (looksLikeRole(p) && !hasCompanyWord(p)) it.role = p
      else it.company = p
    } else if (!it.location && isLocation(p)) it.location = p
    return
  }
  const [a, b, ...more] = parts
  let rf = roleFirst
  if (rf === undefined) {
    const d = roleScore(a) - roleScore(b)
    rf = d > 0 ? true : d < 0 ? false : false
  }
  const [role, company] = rf ? [a, b] : [b, a]
  if (!it.role) it.role = role
  if (!it.company) it.company = company
  if (more.length && !it.location) it.location = more.join(', ')
}

function experienceHooks(id: () => string): Hooks<ExperienceItem> {
  return {
    newItem: () => ({ id: id(), company: '', role: '', location: '', start: '', end: '', bullets: [] }),
    isContinuation: (it, line) => {
      const d = takeDates(line)
      const text = tidy(d.rest)
      if (!text) return d.found && !it.start
      if (isLocation(text)) return true
      return (!it.role || !it.company) && !(d.found && it.start)
    },
    header: (it, line) => {
      const d = takeDates(line)
      if (d.found && !it.start && !it.end) {
        it.start = d.start
        it.end = d.end
      }
      const text = tidy(d.rest)
      if (!text) return
      if (isLocation(text) && (it.company || it.role)) {
        if (!it.location) it.location = text
        return
      }
      expAssign(it, text)
    },
  }
}

/* projects */

const TECH_LABEL =
  /^(?:tech(?:nolog(?:y|ies))?(?:\s*(?:stack|used))?|stack|built\s+with|tools(?:\s+used)?|technologies\s+used|environment|tech\s+stack)\s*[:\-–]\s*(.+)$/i

function projectHooks(id: () => string): Hooks<ProjectItem> {
  let techOpen = false
  return {
    newItem: () => ({ id: id(), name: '', stack: '', dates: '', bullets: [] }),
    special: (it, text, wasBullet) => {
      const m = TECH_LABEL.exec(text)
      if (m) {
        if (!it) return false
        it.stack = it.stack ? `${it.stack}, ${m[1].trim()}` : m[1].trim()
        techOpen = /,$/.test(text)
        return true
      }
      if (techOpen && it && !wasBullet && /^[\p{L}\d+#.][^.!?]*$/u.test(text) && words(text).length <= 8) {
        it.stack = `${it.stack} ${text}`.trim()
        techOpen = /,$/.test(text)
        return true
      }
      techOpen = false
      return false
    },
    isContinuation: (it, line) => {
      const d = takeDates(line)
      const text = tidy(d.rest)
      if (!text) return d.found && !it.dates
      if (!it.stack && looksTech(text) && !sentenceLike(text)) return true
      return false
    },
    header: (it, line, first) => {
      const d = takeDates(line)
      if (d.found && !it.dates) it.dates = d.range ? `${d.start} – ${d.end}` : d.start
      let text = tidy(d.rest)
      if (!text) return
      if (!first) {
        if (!it.stack && looksTech(text)) it.stack = text
        return
      }
      const paren = /\(([^()]*)\)\s*$/.exec(text)
      if (paren && looksTech(paren[1])) {
        it.stack = paren[1].trim()
        text = tidy(text.slice(0, paren.index))
      }
      const parts = splitHeaderParts(text)
      it.name = parts[0] ?? text
      for (const p of parts.slice(1)) {
        if (!it.stack && looksTech(p)) it.stack = p
        else it.bullets.push({ id: '', text: p })
      }
    },
  }
}

/* education */

const SCORE_RES = [
  /\b(?:CGPA|GPA|SGPA|CPI|DGPA)\s*[:\-–]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/gi,
  /\b(?:percentage|percent|aggregate|marks|score)\s*[:\-–]?\s*\d+(?:\.\d+)?\s*%?/gi,
  /\b\d{1,3}(?:\.\d+)?\s*%/g,
  /\b\d(?:\.\d+)?\s*\/\s*10\b/g,
]

type EduParse = {
  school: string
  degree: string
  location: string
  start: string
  end: string
  score: string
  rest: string[]
}

function parseEdu(line: string): EduParse {
  const out: EduParse = { school: '', degree: '', location: '', start: '', end: '', score: '', rest: [] }
  const d = takeDates(line)
  if (d.found) {
    if (d.range) [out.start, out.end] = [d.start, d.end]
    else out.end = d.start
  }
  let text = d.rest
  const scores: string[] = []
  for (const re of SCORE_RES) {
    text = text.replace(re, (m) => {
      scores.push(m.trim())
      return ' '
    })
  }
  out.score = scores.join(', ')
  text = tidy(text)
  if (!text) return out

  const kindOf = (p: string): 'school' | 'degree' | 'loc' | 'other' =>
    isSchool(p) ? 'school' : isDegree(p) ? 'degree' : isLocation(p) ? 'loc' : 'other'
  type Run = { kind: ReturnType<typeof kindOf>; text: string }
  const runs: Run[] = []
  for (const part of splitHeaderParts(text)) {
    // "B.Tech in CSE from XYZ University": split where the school begins.
    const split = isSchool(part) && isDegree(part) ? / (?:from|at|,) /i.exec(part) : null
    const subparts = split ? [part.slice(0, split.index), part.slice(split.index + split[0].length)] : [part]
    for (const sub of subparts) {
      const pieces = sub
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const local: Run[] = []
      for (let i = 0; i < pieces.length; i++) {
        const k = kindOf(pieces[i])
        const prev = local[local.length - 1]
        if (prev && (k === prev.kind || (k === 'other' && prev.kind !== 'loc'))) prev.text += `, ${pieces[i]}`
        else if (prev && prev.kind === 'other' && k !== 'other' && k !== 'loc') {
          prev.kind = k
          prev.text += `, ${pieces[i]}`
        } else local.push({ kind: k, text: pieces[i] })
      }
      runs.push(...local)
    }
  }
  for (const r of runs) {
    if (r.kind === 'school' && !out.school) out.school = r.text
    else if (r.kind === 'degree' && !out.degree) out.degree = r.text
    else if (r.kind === 'loc' && !out.location) out.location = r.text
    else out.rest.push(r.text)
  }
  return out
}

function educationHooks(id: () => string): Hooks<EducationItem> {
  const apply = (it: EducationItem, p: EduParse, newBullet: (t: string) => void) => {
    if (p.school && !it.school) it.school = p.school
    if (p.degree && !it.degree) it.degree = p.degree
    if (p.location && !it.location) it.location = p.location
    if (!it.start && !it.end) [it.start, it.end] = [p.start, p.end]
    if (p.score) it.score = it.score ? `${it.score}, ${p.score}` : p.score
    for (const r of p.rest) {
      if (!it.school) it.school = r
      else if (!it.degree) it.degree = r
      else newBullet(r)
    }
  }
  return {
    newItem: () => ({ id: id(), school: '', degree: '', location: '', start: '', end: '', score: '', bullets: [] }),
    isContinuation: (it, line) => {
      const p = parseEdu(line)
      return !((p.school && it.school) || (p.degree && it.degree) || ((p.start || p.end) && (it.start || it.end)))
    },
    header: (it, line) => apply(it, parseEdu(line), (t) => it.bullets.push({ id: '', text: t })),
  }
}

/* ------------------------------------------------------------------ other sections */

function parseSkills(lines: string[], id: (p: string) => string): SkillGroup[] {
  const groups: SkillGroup[] = []
  let pending: SkillGroup | null = null // "Languages:" with its items on the following lines
  let last: { group: SkillGroup; open: boolean } | null = null
  let fallback: SkillGroup | null = null

  const split = (s: string): string[] => {
    const items: string[] = []
    let depth = 0
    let buf = ''
    for (const ch of s) {
      if ('([{'.includes(ch)) depth++
      if (')]}'.includes(ch)) depth = Math.max(0, depth - 1)
      if (depth === 0 && /[,;|•·▪●]/.test(ch)) {
        items.push(buf)
        buf = ''
      } else buf += ch
    }
    items.push(buf)
    return items.map((x) => x.trim().replace(/[.]$/, '')).filter(Boolean)
  }
  const addItems = (g: SkillGroup, s: string) => {
    for (const name of split(s)) g.items.push({ id: id('s'), name })
  }
  const mk = (label: string) => {
    const g: SkillGroup = { id: id('sk'), label, items: [] }
    groups.push(g)
    return g
  }

  const bareLabel =
    /^(?:programming\s+)?(?:languages?|frameworks?|libraries|tools?|databases?|platforms?|cloud|devops|front-?end|back-?end|web|mobile|ml|ai|data|concepts|core|soft skills|other|technologies|developer tools|operating systems?|methodologies|testing)(?:\s*(?:&|and|\/)\s*\w+)*$/i
  for (const raw of lines) {
    if (!raw) continue
    const line = bulletText(raw) ?? raw
    if (!line) continue
    const m = /^([^:]{1,40}):\s*(.*)$/.exec(line) ?? (bareLabel.test(line) ? ([line, line, ''] as string[]) : null)
    if (m && words(m[1]).length <= 5 && !/[.,;]/.test(m[1])) {
      const g = mk(m[1].trim())
      pending = null
      if (m[2].trim()) {
        addItems(g, m[2])
        last = { group: g, open: /[,;]$/.test(m[2].trim()) }
      } else {
        pending = g
        last = null
      }
      continue
    }
    if (pending) {
      addItems(pending, line)
      last = { group: pending, open: /[,;]$/.test(line) }
      continue
    }
    if (last && (/^[a-z]/.test(line) || last.open)) {
      addItems(last.group, line)
      last.open = /[,;]$/.test(line)
      continue
    }
    fallback ??= mk('Skills')
    addItems(fallback, line)
    last = { group: fallback, open: /[,;]$/.test(line) }
  }
  return groups.filter((g) => g.items.length > 0)
}

function parseCertifications(lines: string[], id: (p: string) => string): CertificationItem[] {
  const items: CertificationItem[] = []
  for (const raw of lines) {
    if (!raw) continue
    const glyph = bulletText(raw)
    const line = glyph ?? raw
    if (!line) continue
    const prev = items[items.length - 1]
    if (prev && /^[a-z]/.test(line)) {
      prev.name = `${prev.name} ${line}`
      continue
    }
    const d = takeDates(line)
    const date = d.found ? (d.range ? d.end || d.start : d.start) : ''
    let text = tidy(d.rest)
    let issuer = ''
    const paren = /\(([^()]+)\)\s*$/.exec(text)
    if (paren) {
      issuer = paren[1].trim()
      text = tidy(text.slice(0, paren.index))
    }
    if (!issuer) {
      const parts = splitHeaderParts(text)
      if (parts.length >= 2) {
        text = parts[0]
        issuer = parts.slice(1).join(', ')
      } else {
        const by = / (?:by|from|issued by|–|-) /i.exec(text)
        if (by) {
          issuer = text.slice(by.index + by[0].length).trim()
          text = text.slice(0, by.index).trim()
        }
      }
    }
    items.push({ id: id('cert'), name: text, issuer, date })
  }
  return items.filter((c) => c.name)
}

/** Lines of the custom section to bullets. Without any bullet glyphs every line is its own bullet. */
function parseCustom(lines: string[], newBullet: (t: string) => Bullet): Bullet[] {
  const bullets: Bullet[] = []
  const glyphs = lines.some((l) => bulletText(l) !== null)
  let afterBlank = false
  for (const raw of lines) {
    if (!raw) {
      afterBlank = true
      continue
    }
    const bt = bulletText(raw)
    const line = bt ?? raw
    if (!line) continue
    const prev = bullets[bullets.length - 1]
    const wrap =
      prev &&
      bt === null &&
      (/^[a-z(]/.test(line) ||
        (glyphs && !afterBlank && !/[.!?]["')\]]?$/.test(prev.text) && !genericNewEntryLike(line)))
    afterBlank = false
    if (wrap) prev.text = `${prev.text} ${line}`
    else bullets.push(newBullet(line))
  }
  return bullets
}

/* ------------------------------------------------------------------ main */

type Block = { kind: HeadingKind; title: string; lines: string[] }

/** An empty resume with every section hidden: the starting point for imported content. */
export function emptyContent(): ResumeContent {
  return {
    version: 1,
    order: [...SECTION_ORDER],
    contact: { hidden: false, name: '', title: '', location: '', email: '', github: '', linkedin: '', website: '' },
    summary: { hidden: true, text: '' },
    experience: { hidden: true, items: [] },
    projects: { hidden: true, items: [] },
    education: { hidden: true, items: [] },
    skills: { hidden: true, groups: [] },
    certifications: { hidden: true, items: [] },
    custom: { hidden: true, title: 'Additional', bullets: [] },
  }
}

/** Removes phone numbers from every string in the content, as a last safety net. */
function scrubPhones<T>(value: T): T {
  if (typeof value === 'string') return stripPhones(value) as T
  if (Array.isArray(value)) return value.map(scrubPhones) as T
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubPhones(v)])) as T
  return value
}

const SECTION_NAMES: Record<string, string> = {
  experience: 'an Experience',
  projects: 'a Projects',
  education: 'an Education',
  skills: 'a Skills',
}

export function parseResumeText(text: string): { content: ResumeContent; warnings: string[] } {
  try {
    return parseInner(text)
  } catch {
    return {
      content: emptyContent(),
      warnings: [
        "Something went wrong reading that file's text, so nothing was imported. You can fill the resume in by hand.",
      ],
    }
  }
}

function parseInner(input: string): { content: ResumeContent; warnings: string[] } {
  const warnings: string[] = []
  const id = makeIds()
  const newBullet = (text: string): Bullet => ({ id: id('b'), text })
  const content = emptyContent()

  const all = input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => stripPhones(l.replace(/\s+/g, ' ').trim()))
  while (all.length && !all[all.length - 1]) all.pop()
  if (!all.some(Boolean)) {
    return {
      content,
      warnings: [
        'No text could be read from that file. It may be a scan or an image; try a text-based PDF or a .docx.',
      ],
    }
  }

  /* 1. Split into a header and sections. */
  let current: HeadingKind | null = null
  const found: { index: number; heading: Heading }[] = []
  all.forEach((line, index) => {
    if (!line) return
    const h = knownHeading(line, current)
    if (h) {
      found.push({ index, heading: h })
      current = h.kind
    }
  })
  const capsStyle = found.length > 0 && found.filter((f) => isAllCaps(all[f.index])).length * 2 >= found.length
  const firstKnown = found.length ? found[0].index : -1
  if (capsStyle) {
    // ALL CAPS résumés also mark unknown sections in caps ("LEADERSHIP", "EXTRA CURRICULAR").
    all.forEach((line, index) => {
      if (!line || index <= firstKnown || found.some((f) => f.index === index)) return
      const label = normaliseHeading(line)
      if (!label || !isAllCaps(line) || words(label).length > 4 || label.replace(/[^a-z]/g, '').length < 3) return
      if (/[,.;]/.test(line.replace(/:$/, '')) || bulletText(line) !== null) return
      found.push({ index, heading: { kind: 'custom', title: titleCase(label), known: false } })
    })
    found.sort((a, b) => a.index - b.index)
  }

  const headerEnd = found.length ? found[0].index : Math.min(all.length, 8)
  const header = all.slice(0, headerEnd).filter(Boolean)
  const blocks: Block[] = []
  found.forEach((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].index : all.length
    const lines = all.slice(f.index + 1, end)
    if (f.heading.inline) lines.unshift(f.heading.inline)
    blocks.push({ kind: f.heading.kind, title: f.heading.title, lines })
  })
  if (!found.length) {
    warnings.push(
      "Couldn't find any section headings (Experience, Education, Skills...), so most of the text was put in 'Additional'.",
    )
    const rest = all.slice(headerEnd)
    if (rest.some(Boolean)) blocks.push({ kind: 'custom', title: 'Additional', lines: rest })
  }

  /* 2. Contact. */
  const { contact, leftover } = parseHeader(header)
  // The whole text may mention the links further down ("Links" blocks, footers).
  const body = all.join('\n')
  if (!contact.email) contact.email = body.match(EMAIL_RE)?.[0] ?? ''
  if (!contact.linkedin) contact.linkedin = cleanUrl(body.match(LINKEDIN_RE)?.[0] ?? '')
  if (!contact.github) {
    const gh = body.match(GITHUB_RE)?.[0]
    contact.github = gh ? githubUser(gh) : ''
  }
  Object.assign(content.contact, contact)
  if (!contact.name) warnings.push("Couldn't find your name at the top of the file.")
  if (!contact.email) warnings.push("Couldn't find an email address.")

  /* 3. Sections, in the order they appeared. */
  const seen: SectionKey[] = ['contact']
  const mark = (k: SectionKey) => {
    if (!seen.includes(k)) seen.push(k)
  }
  const customBlocks: { title: string; bullets: Bullet[] }[] = []
  const skipped: string[] = []
  const summaryParts: string[] = []
  const merged = new Map<Section, string[]>()
  for (const b of blocks) {
    if (b.kind === 'skip') {
      skipped.push(b.title)
      continue
    }
    if (b.kind === 'custom') {
      const bullets = parseCustom(b.lines, newBullet)
      if (bullets.length) {
        customBlocks.push({ title: b.title, bullets })
        mark('custom')
      }
      continue
    }
    merged.set(b.kind, [...(merged.get(b.kind) ?? []), ...(merged.has(b.kind) ? [''] : []), ...b.lines])
    mark(b.kind)
  }

  for (const [kind, lines] of merged) {
    switch (kind) {
      case 'summary':
        summaryParts.push(
          lines
            .filter(Boolean)
            .map((l) => bulletText(l) ?? l)
            .join(' '),
        )
        break
      case 'experience':
        content.experience.items = runEntries(
          lines,
          newBullet,
          experienceHooks(() => id('exp')),
        )
        break
      case 'projects':
        content.projects.items = runEntries(
          lines,
          newBullet,
          projectHooks(() => id('prj')),
        )
        break
      case 'education':
        content.education.items = runEntries(
          lines,
          newBullet,
          educationHooks(() => id('edu')),
        )
        break
      case 'skills':
        content.skills.groups = parseSkills(lines, id)
        break
      case 'certifications':
        content.certifications.items = parseCertifications(lines, id)
        break
    }
  }
  // Entry parsers leave placeholder ids on description lines that came from a header; give them real ones.
  for (const list of [content.experience.items, content.projects.items, content.education.items])
    for (const it of list) for (const b of it.bullets) if (!b.id) b.id = id('b')
  for (const list of [content.experience.items, content.projects.items, content.education.items])
    for (const it of list as { bullets: Bullet[] }[]) it.bullets = it.bullets.filter((b) => b.text.trim())
  content.experience.items = content.experience.items.filter((i) => i.company || i.role || i.bullets.length || i.start)
  content.projects.items = content.projects.items.filter((i) => i.name || i.stack || i.bullets.length)
  content.education.items = content.education.items.filter((i) => i.school || i.degree || i.bullets.length || i.score)

  /* 4. Header text that was not contact details: a paragraph is the summary, the rest goes to "Additional". */
  const unassigned: string[] = []
  for (const l of leftover) {
    if (!summaryParts.length && words(l).length >= 8 && !merged.has('summary')) summaryParts.push(l)
    else unassigned.push(l)
  }
  const summary = summaryParts.join(' ').trim()
  if (summary) {
    content.summary.text = summary
    if (!merged.has('summary')) mark('summary')
  }
  if (unassigned.length) {
    customBlocks.push({ title: 'Additional', bullets: unassigned.map(newBullet) })
    mark('custom')
    warnings.push(
      `${unassigned.length} line${unassigned.length === 1 ? '' : 's'} didn't fit any section and ${unassigned.length === 1 ? 'was' : 'were'} put in 'Additional'.`,
    )
  }

  /* 5. The single custom section. */
  if (customBlocks.length === 1) {
    content.custom.title = customBlocks[0].title
    content.custom.bullets = customBlocks[0].bullets
  } else if (customBlocks.length > 1) {
    content.custom.title = 'Additional'
    for (const cb of customBlocks) {
      content.custom.bullets.push(
        ...cb.bullets.map((b) => (cb.title === 'Additional' ? b : { ...b, text: `${cb.title}: ${b.text}` })),
      )
    }
    const names = customBlocks.filter((cb) => cb.title !== 'Additional').map((cb) => cb.title)
    if (names.length > 1)
      warnings.push(`${names.join(', ')} were combined into one 'Additional' section (a resume has one extra section).`)
  }
  if (skipped.length)
    warnings.push(
      `Skipped the ${skipped.join(', ')} section${skipped.length === 1 ? '' : 's'}: personal details are not imported.`,
    )

  /* 6. Hidden flags, order, warnings. */
  content.summary.hidden = !content.summary.text
  content.experience.hidden = content.experience.items.length === 0
  content.projects.hidden = content.projects.items.length === 0
  content.education.hidden = content.education.items.length === 0
  content.skills.hidden = content.skills.groups.length === 0
  content.certifications.hidden = content.certifications.items.length === 0
  content.custom.hidden = content.custom.bullets.length === 0
  content.order = [...seen, ...SECTION_ORDER.filter((k) => !seen.includes(k))]

  for (const key of ['experience', 'education', 'skills', 'projects'] as const) {
    const empty = key === 'skills' ? content.skills.groups.length === 0 : content[key].items.length === 0
    if (empty) warnings.push(`Couldn't find ${SECTION_NAMES[key]} section.`)
  }

  const clean = scrubPhones(content)
  const checked = toContent(clean)
  if (!checked)
    return {
      content: emptyContent(),
      warnings: ['The text could not be turned into a resume. You can fill it in by hand.'],
    }
  return { content: checked, warnings }
}
