/**
 * Sample data for the UI until the database (Phase 2) and the daily search (Phase 7) exist.
 * Company names are from the target list only; these are not real postings.
 * Only details that are already public go here: no phone numbers, addresses or keys.
 */

export type User = { firstName: string; initials: string }

export type SearchStatus = {
  schedule: string
  lastRun: string
  sourcesWorking: number
  sourcesTotal: number
}

export type Counts = { resumes: number; newMatches: number; applied: number; interviews: number; newToday: number }

export type Match = {
  id: string
  role: string
  company: string
  location: string
  score: number
  applyUrl: string
}

export const sampleUser: User = { firstName: 'Syed', initials: 'SM' }

export const sampleSearch: SearchStatus = {
  schedule: 'Running every day at 07:00',
  lastRun: 'today, 07:02',
  sourcesWorking: 38,
  sourcesTotal: 40,
}

export const sampleCounts: Counts = { resumes: 4, newMatches: 24, applied: 9, interviews: 2, newToday: 6 }

export const sampleMatches: Match[] = [
  {
    id: 'm1',
    role: 'Graduate Software Engineer',
    company: 'Atlassian',
    location: 'Bengaluru',
    score: 92,
    applyUrl: 'https://www.atlassian.com/company/careers',
  },
  {
    id: 'm2',
    role: 'Software Engineering Intern',
    company: 'Google',
    location: 'Hyderabad',
    score: 88,
    applyUrl: 'https://www.google.com/about/careers/applications/',
  },
  {
    id: 'm3',
    role: 'ML Engineer Intern',
    company: 'PhonePe',
    location: 'Bengaluru',
    score: 84,
    applyUrl: 'https://www.phonepe.com/careers/',
  },
  {
    id: 'm4',
    role: 'SDE Intern',
    company: 'Flipkart',
    location: 'Bengaluru',
    score: 77,
    applyUrl: 'https://www.flipkartcareers.com/',
  },
  {
    id: 'm5',
    role: 'Applied AI Intern',
    company: 'Postman',
    location: 'Remote, India',
    score: 74,
    applyUrl: 'https://www.postman.com/company/careers/',
  },
]
