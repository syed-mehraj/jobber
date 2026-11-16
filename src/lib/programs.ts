/*
 * Programs and sites the app can't fetch automatically (no public feed, or their terms forbid automated access).
 * Compiled from two research passes in Nov 2026 (docs/SOURCES.md). Eligibility notes are for a final-year
 * CS student graduating in 2027; always confirm on the official page before applying.
 */

export type Verdict = 'check' | 'plan' | 'conditional' | 'not-eligible' | 'avoid'

export type Program = {
  name: string
  url: string
  what: string
  you: string
  when: string
  verdict: Verdict
}

export const programs: Program[] = [
  {
    name: 'PM Internship Scheme',
    url: 'https://pminternship.mca.gov.in/',
    what: 'Government-backed internships at large companies. At least ₹9,000 a month; 6–9 months (reported).',
    you: 'Final-year students became eligible in Apr 2026, with a No Objection Certificate from your college. Still excluded: students of IITs, IIMs, NLUs, IISERs, NID and IIITs; families earning over ₹8 lakh a year; families with a permanent government employee. Few software or ML roles, because partner companies are chosen by CSR spend.',
    when: 'Current pilot round runs to Dec 2026; the full scheme is expected in 2027. Apply to at most 5. Login with Aadhaar, no public feed.',
    verdict: 'conditional',
  },
  {
    name: 'Google Summer of Code',
    url: 'https://summerofcode.withgoogle.com/',
    what: 'Paid, remote open-source work with a mentor. Strong signal on a resume.',
    you: 'Eligible (18+, new to open source or a student).',
    when: 'Applications around March 2027. Pick an organisation and start contributing in Jan–Feb.',
    verdict: 'plan',
  },
  {
    name: 'LFX Mentorship (Linux Foundation)',
    url: 'https://mentorship.lfx.linuxfoundation.org/',
    what: 'Paid mentorships on CNCF, Linux Foundation and related projects.',
    you: 'Eligible.',
    when: 'Three terms a year; applications open around mid-January, mid-April and mid-July.',
    verdict: 'plan',
  },
  {
    name: 'Outreachy',
    url: 'https://www.outreachy.org/',
    what: 'Paid, remote open-source internships.',
    you: 'Only for people underrepresented in tech (for example women and non-binary people). Students in India can only join the May–August cohort.',
    when: 'Applications open about four months before each cohort.',
    verdict: 'conditional',
  },
  {
    name: 'NITI Aayog internship',
    url: 'https://workforindia.niti.gov.in/',
    what: 'Policy and data internships with the government think tank. Unpaid.',
    you: 'Eligible as a final-year student.',
    when: 'Apply between the 1st and 10th of each month.',
    verdict: 'check',
  },
  {
    name: 'ISRO internships (NRSC Hyderabad and other centres)',
    url: 'https://www.nrsc.gov.in/nrscnew/Training_Student_Eligibility.php',
    what: 'Project internships at ISRO centres. Unpaid.',
    you: 'Eligible as a project trainee once 6th semester is done, with 60% or CGPA 6.32; Indian citizens. Each centre runs its own applications.',
    when: 'Check the Hyderabad centre (NRSC) page for open calls.',
    verdict: 'check',
  },
  {
    name: 'MeitY and NIC internships',
    url: 'https://intern.meity.gov.in/',
    what: 'Internships with the IT ministry and the National Informatics Centre.',
    you: 'Eligible.',
    when: 'Digital India Internship (₹10k/month) opened 10–29 Apr in 2026; NIC posts one-off calls.',
    verdict: 'plan',
  },
  {
    name: 'Amazon ML Summer School, Flipkart GRiD',
    url: 'https://www.amazon.science/',
    what: 'Company-run learning programs and contests that can lead to interviews.',
    you: 'Unverified whether 2027 graduates can join the next editions. Note: GRiD 6.0 had about 4.8 lakh registrants for 200 interview slots.',
    when: 'Usually mid-year.',
    verdict: 'conditional',
  },
  {
    name: '6-month internships (Jan–Jun) and 2027 new-grad roles',
    url: '/jobs',
    what: 'The standard final-year track at product companies, and what the Jobs page fetches automatically.',
    you: 'Eligible. Microsoft, Salesforce and others opened 2027 new-grad roles in Oct–Nov 2026.',
    when: 'Rolling, mostly Aug–Jan. Apply within a few days of posting.',
    verdict: 'check',
  },
  {
    name: 'Google STEP, IAS-INSA-NASI SRFP, RBI summer placement',
    url: 'https://careers.google.com/',
    what: 'Well-known student programs.',
    you: 'Not eligible: these take only 1st–3rd year (STEP, SRFP) or penultimate-year (RBI) students.',
    when: 'n/a',
    verdict: 'not-eligible',
  },
]

export type Platform = { name: string; url: string; why: string; how: string; verdict: Verdict }

/** Sites worth checking by hand. None of these allow automated fetching or have a public feed. */
export const platforms: Platform[] = [
  {
    name: 'Y Combinator jobs in India',
    url: 'https://www.ycombinator.com/jobs/location/india',
    why: 'Every company is YC-backed; you apply to founders directly, and there is far less fresher traffic than on mass portals.',
    how: 'Filter for Intern and "Software Engineer I". Also build a Work at a Startup profile so founders can reach you.',
    verdict: 'check',
  },
  {
    name: 'Career sites the app can’t read',
    url: 'https://www.flipkartcareers.com/',
    why: 'Google, Microsoft, Amazon and Netflix are now read automatically (unofficially, once an hour). These still are not: Flipkart (its page needs an access token), Apple, Meta, Uber, Atlassian, and the Workday sites of Adobe, Nvidia, Salesforce, PayPal, Intel, Walmart, Qualcomm, Visa and Mastercard; also PhonePe, Zerodha, Postman, Zoho, Rippling, BrowserStack and Sprinklr.',
    how: 'Save a search for "intern" or "new grad" in India on each site and turn on its email alerts.',
    verdict: 'check',
  },
  {
    name: 'Wellfound',
    url: 'https://wellfound.com/jobs',
    why: 'Startup roles with salary shown and direct messages to the team. Wellfound’s own analysis puts its interview rate at about 6%, twice LinkedIn’s (vendor claim).',
    how: 'Use the "0–1 year" filter; skip the sales and edtech-mentor roles mixed into the fresher feed.',
    verdict: 'check',
  },
  {
    name: 'Peak XV talent network',
    url: 'https://careers.peakxv.com/jobs',
    why: 'Jobs across Peak XV’s portfolio (Razorpay, Freshworks, Meesho, Atlan, Whatfix, CleverTap…), with Intern and Seed-stage filters.',
    how: 'Check the location, then apply on the startup’s own careers page.',
    verdict: 'check',
  },
  {
    name: 'Lightspeed, Accel and Elevation portfolio boards',
    url: 'https://jobs.lsvp.com/jobs',
    why: 'The same idea for other investors’ portfolios. Accel: jobs.accel.com; Elevation: talent.elevationcapital.com (skews senior).',
    how: 'Filter to India and early-career roles.',
    verdict: 'check',
  },
  {
    name: 'HackerEarth hiring challenges',
    url: 'https://www.hackerearth.com/challenges/hiring/',
    why: 'Timed coding, MCQ and SQL rounds; top scorers are shortlisted, which keeps casual applicants out.',
    how: 'Read the experience cut-off first: some challenges ask for 1–5 years.',
    verdict: 'check',
  },
  {
    name: 'Geektrust',
    url: 'https://www.geektrust.com/jobs',
    why: 'You submit clean, tested code instead of a resume; a good score goes straight to partner teams.',
    how: 'You only get 3 attempts, then a 6-month lock. Use one only when a 0–1 year role is open.',
    verdict: 'conditional',
  },
  {
    name: 'Instahyre',
    url: 'https://www.instahyre.com/',
    why: 'Recruiters at product companies search candidates here; good reputation for call quality.',
    how: 'Keep a complete profile for inbound interest. Very few fresher engineering listings.',
    verdict: 'plan',
  },
  {
    name: 'r/developersIndia hiring threads',
    url: 'https://www.reddit.com/r/developersIndia/',
    why: 'Monthly "Who’s looking for work?" threads where employees offer referrals.',
    how: 'Post your stack and project links each month.',
    verdict: 'check',
  },
  {
    name: 'Recently funded startups',
    url: 'https://entrackr.com/category/funding/',
    why: 'Teams that just raised a Seed or Series A often need builders before they post jobs.',
    how: 'Message an engineering lead with a four-line note and a link to a deployed project.',
    verdict: 'plan',
  },
  {
    name: 'Skip: Unstop, Apna, Naukri, TopHire, Weekday, paid “placement guarantee” courses, Telegram job channels',
    url: 'https://www.ycombinator.com/jobs/location/india',
    why: 'Mass portals with huge applicant piles, recruiters for senior roles, or common routes for scams.',
    how: 'Never pay for job access. End any chat that asks for fees or moves you to WhatsApp or Telegram.',
    verdict: 'avoid',
  },
]
