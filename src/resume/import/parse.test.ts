import { describe, expect, it } from 'vitest'
import { allIds, toContent, type ResumeContent } from '../types'
import { parseResumeText, stripPhones } from './parse'

/* Texts below are written the way a PDF extractor returns them: one visual line per line. */

const INDIAN_STUDENT = `ARJUN REDDY
Hyderabad, India | arjun.reddy@example.com | linkedin.com/in/arjunreddy | github.com/arjunreddy
OBJECTIVE
Final-year computer science student looking for a software engineering role where I can build reliable backend systems.
EDUCATION
B.Tech in Computer Science and Engineering
Vasavi College of Engineering, Hyderabad 2023 - 2027
CGPA: 8.7 / 10
Narayana Junior College, Hyderabad | Intermediate (MPC) | 2021 - 2023
Percentage: 96%
TECHNICAL SKILLS
Languages: Python, Java, C++, SQL
Frameworks: Flask, React, Node.js
Tools: Git, Docker, Postman
INTERNSHIPS
Software Developer Intern, Parallel Labs
Jul 2026 – Present
• Built REST APIs in Flask for an order management service used by 12 restaurants
• Wrote unit tests that raised coverage from 40% to 78%
Data Science Intern | Kaizen Analytics | 06/2024 – 08/2024
• Cleaned and analysed sales data with Pandas
PROJECTS
Smart Attendance System
Tech: Python, OpenCV, Flask
• Built a face recognition attendance system that marks a class in under 10 seconds
• Stored records in SQLite and exported daily reports
Expense Tracker | React, Firebase | 2025
• Tracks shared expenses between flatmates
ACHIEVEMENTS
• Winner, Smart India Hackathon internal round 2025
CERTIFICATIONS
AWS Cloud Practitioner Essentials - Amazon Web Services, 2025
Python for Everybody | Coursera | Mar 2024`

const US_STYLE = `Jordan Lee
Austin, TX | jordan.lee@example.com | jordanlee.dev | linkedin.com/in/jordanlee
Software Engineer
SUMMARY
Backend engineer with four years of experience building payment APIs.
EXPERIENCE
Senior Software Engineer | Northwind Payments | Jan 2023 - Present
- Led migration of the billing service to event-driven architecture
- Cut p95 latency from 900 ms to 220 ms
Software Engineer | Contoso Systems | Jun 2020 - Dec 2022
- Built internal tooling used by 40 support agents
EDUCATION
University of Texas at Austin | B.S. Computer Science | 2016 - 2020
SKILLS
Go, Python, PostgreSQL, Kubernetes, Terraform`

const MESSY = `Priya Nair
Phone: +1 (555) 010-0199
priya.nair@example.com | Bengaluru, India | +44 20 7946 0958
Profile
Curious engineer who enjoys turning messy data into dashboards that people actually use every day.
Work Experience
Backend Intern at Orbit Labs (Jun 2025 - Aug 2025)
• Designed a caching layer for the search API which reduced
database load by roughly a third
• Wrote the on-call runbook
for the payments team.
Projects
Campus Cab Share
• Matches students going the same way using a greedy
algorithm and sends a notification
Education
National Institute of Technology, Warangal
B.Tech, Electronics and Communication
2022 - 2026
Leadership
• Captain of the college cricket team (2024)
• Organised the annual tech fest with a team of
thirty volunteers
Skills
Python, SQL, Tableau`

function ids(c: ResumeContent) {
  return allIds(c)
}

function expectValid(c: ResumeContent) {
  expect(toContent(c)).not.toBeNull()
  const list = ids(c)
  expect(new Set(list).size).toBe(list.length)
  expect(list.every((x) => x && typeof x === 'string')).toBe(true)
  expect(JSON.stringify(c)).not.toMatch(/\(555\)|010-0199|7946 0958/)
  expect(JSON.stringify(c)).not.toMatch(
    /\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d[\s().-]?\d/,
  )
}

describe('parseResumeText: an Indian CS student resume with ALL CAPS headings', () => {
  const { content: c, warnings } = parseResumeText(INDIAN_STUDENT)

  it('reads the contact block', () => {
    expect(c.contact).toMatchObject({
      name: 'ARJUN REDDY',
      email: 'arjun.reddy@example.com',
      location: 'Hyderabad, India',
      linkedin: 'linkedin.com/in/arjunreddy',
      github: 'github.com/arjunreddy',
    })
  })

  it('reads the objective as the summary', () => {
    expect(c.summary.hidden).toBe(false)
    expect(c.summary.text).toMatch(/^Final-year computer science student/)
  })

  it('splits education into school, degree, dates and score', () => {
    expect(c.education.items).toHaveLength(2)
    expect(c.education.items[0]).toMatchObject({
      school: 'Vasavi College of Engineering',
      degree: 'B.Tech in Computer Science and Engineering',
      location: 'Hyderabad',
      start: '2023',
      end: '2027',
      score: 'CGPA: 8.7 / 10',
    })
    expect(c.education.items[1]).toMatchObject({
      school: 'Narayana Junior College',
      degree: 'Intermediate (MPC)',
      start: '2021',
      end: '2023',
      score: 'Percentage: 96%',
    })
  })

  it('makes skills groups from "Label: items" lines', () => {
    expect(c.skills.groups.map((g) => g.label)).toEqual(['Languages', 'Frameworks', 'Tools'])
    expect(c.skills.groups[0].items.map((i) => i.name)).toEqual(['Python', 'Java', 'C++', 'SQL'])
    expect(c.skills.groups[1].items.map((i) => i.name)).toEqual(['Flask', 'React', 'Node.js'])
  })

  it('reads internships with role, company, dates and bullets', () => {
    expect(c.experience.items).toHaveLength(2)
    expect(c.experience.items[0]).toMatchObject({
      role: 'Software Developer Intern',
      company: 'Parallel Labs',
      start: 'Jul 2026',
      end: 'Present',
    })
    expect(c.experience.items[0].bullets.map((b) => b.text)).toEqual([
      'Built REST APIs in Flask for an order management service used by 12 restaurants',
      'Wrote unit tests that raised coverage from 40% to 78%',
    ])
    expect(c.experience.items[1]).toMatchObject({
      role: 'Data Science Intern',
      company: 'Kaizen Analytics',
      start: '06/2024',
      end: '08/2024',
    })
  })

  it('reads projects with a "Tech:" line and a "Name | Stack | Year" line', () => {
    expect(c.projects.items).toHaveLength(2)
    expect(c.projects.items[0]).toMatchObject({ name: 'Smart Attendance System', stack: 'Python, OpenCV, Flask' })
    expect(c.projects.items[0].bullets).toHaveLength(2)
    expect(c.projects.items[1]).toMatchObject({ name: 'Expense Tracker', stack: 'React, Firebase', dates: '2025' })
  })

  it('puts achievements in the extra section and reads certifications', () => {
    expect(c.custom.title).toBe('Achievements')
    expect(c.custom.hidden).toBe(false)
    expect(c.custom.bullets[0].text).toBe('Winner, Smart India Hackathon internal round 2025')
    expect(c.certifications.items).toEqual([
      expect.objectContaining({
        name: 'AWS Cloud Practitioner Essentials',
        issuer: 'Amazon Web Services',
        date: '2025',
      }),
      expect.objectContaining({ name: 'Python for Everybody', issuer: 'Coursera', date: 'Mar 2024' }),
    ])
  })

  it('follows the order the sections appeared and is valid', () => {
    expect(c.order).toEqual([
      'contact',
      'summary',
      'education',
      'skills',
      'experience',
      'projects',
      'custom',
      'certifications',
    ])
    expect(warnings).toEqual([])
    expectValid(c)
  })
})

describe('parseResumeText: a one-column US-style resume with "Role | Company | Dates"', () => {
  const { content: c, warnings } = parseResumeText(US_STYLE)

  it('reads contact, headline and summary', () => {
    expect(c.contact).toMatchObject({
      name: 'Jordan Lee',
      title: 'Software Engineer',
      email: 'jordan.lee@example.com',
      location: 'Austin, TX',
      website: 'jordanlee.dev',
      linkedin: 'linkedin.com/in/jordanlee',
    })
    expect(c.summary.text).toBe('Backend engineer with four years of experience building payment APIs.')
  })

  it('splits the role, company and dates of each job', () => {
    expect(c.experience.items).toHaveLength(2)
    expect(c.experience.items[0]).toMatchObject({
      role: 'Senior Software Engineer',
      company: 'Northwind Payments',
      start: 'Jan 2023',
      end: 'Present',
    })
    expect(c.experience.items[0].bullets).toHaveLength(2)
    expect(c.experience.items[1]).toMatchObject({
      role: 'Software Engineer',
      company: 'Contoso Systems',
      start: 'Jun 2020',
      end: 'Dec 2022',
    })
  })

  it('reads a one-line education entry and an unlabelled skills list', () => {
    expect(c.education.items[0]).toMatchObject({
      school: 'University of Texas at Austin',
      degree: 'B.S. Computer Science',
      start: '2016',
      end: '2020',
    })
    expect(c.skills.groups).toHaveLength(1)
    expect(c.skills.groups[0].label).toBe('Skills')
    expect(c.skills.groups[0].items.map((i) => i.name)).toEqual([
      'Go',
      'Python',
      'PostgreSQL',
      'Kubernetes',
      'Terraform',
    ])
  })

  it('warns only about the missing projects section, and is valid', () => {
    expect(warnings).toEqual(["Couldn't find a Projects section."])
    expect(c.projects.hidden).toBe(true)
    expect(c.certifications.hidden).toBe(true)
    expectValid(c)
  })
})

describe('parseResumeText: a messy resume', () => {
  const { content: c, warnings } = parseResumeText(MESSY)

  it('never keeps the phone numbers', () => {
    expect(JSON.stringify(c)).not.toMatch(/555|7946|0958/)
    expect(c.contact).toMatchObject({
      name: 'Priya Nair',
      email: 'priya.nair@example.com',
      location: 'Bengaluru, India',
    })
  })

  it('reads "Role at Company (dates)" and joins wrapped bullets', () => {
    expect(c.experience.items).toHaveLength(1)
    expect(c.experience.items[0]).toMatchObject({
      role: 'Backend Intern',
      company: 'Orbit Labs',
      start: 'Jun 2025',
      end: 'Aug 2025',
    })
    expect(c.experience.items[0].bullets.map((b) => b.text)).toEqual([
      'Designed a caching layer for the search API which reduced database load by roughly a third',
      'Wrote the on-call runbook for the payments team.',
    ])
  })

  it('joins wrapped project bullets and reads education split over three lines', () => {
    expect(c.projects.items[0].name).toBe('Campus Cab Share')
    expect(c.projects.items[0].bullets).toHaveLength(1)
    expect(c.projects.items[0].bullets[0].text).toBe(
      'Matches students going the same way using a greedy algorithm and sends a notification',
    )
    expect(c.education.items).toHaveLength(1)
    expect(c.education.items[0]).toMatchObject({
      school: 'National Institute of Technology',
      location: 'Warangal',
      degree: 'B.Tech, Electronics and Communication',
      start: '2022',
      end: '2026',
    })
  })

  it('keeps an unknown "Leadership" section as the extra section', () => {
    expect(c.custom.title).toBe('Leadership')
    expect(c.custom.bullets.map((b) => b.text)).toEqual([
      'Captain of the college cricket team (2024)',
      'Organised the annual tech fest with a team of thirty volunteers',
    ])
  })

  it('reads the profile paragraph and skills, and is valid', () => {
    expect(c.summary.text).toMatch(/^Curious engineer/)
    expect(c.skills.groups[0].items.map((i) => i.name)).toEqual(['Python', 'SQL', 'Tableau'])
    expect(warnings).toEqual([])
    expectValid(c)
  })
})

describe('parseResumeText: edge cases', () => {
  it('never throws and always returns valid content', () => {
    for (const text of ['', '   \n\n', 'x', '•\n•\n•', 'EXPERIENCE\n', '::::\n|||', 'a'.repeat(5000), '\u0000•']) {
      const { content } = parseResumeText(text)
      expect(toContent(content)).not.toBeNull()
    }
  })

  it('warns when there is no text', () => {
    expect(parseResumeText('').warnings[0]).toMatch(/No text could be read/)
  })

  it('puts text without headings in Additional and warns', () => {
    const { content, warnings } = parseResumeText('Sam Rivera\nsam@example.com\nI like trains.\nI also like boats.')
    expect(content.contact.name).toBe('Sam Rivera')
    expect(warnings.join(' ')).toMatch(/section headings/)
    expect(content.custom.hidden).toBe(false)
  })

  it('combines several unknown sections into Additional with prefixed bullets', () => {
    const { content, warnings } = parseResumeText(
      'Sam Rivera\nsam@example.com\nEducation\nXYZ University | B.Sc. Physics | 2018 - 2021\nLeadership\n- Chess club president\nInterests\n- Hiking',
    )
    expect(content.custom.title).toBe('Additional')
    expect(content.custom.bullets.map((b) => b.text)).toEqual(['Leadership: Chess club president', 'Interests: Hiking'])
    expect(warnings.join(' ')).toMatch(/combined/)
  })

  it('drops personal details sections', () => {
    const { content } = parseResumeText(
      'Sam Rivera\nsam@example.com\nSkills\nPython\nPersonal Details\nDate of Birth: 1 Jan 2000\nAddress: 12-3 Some Street',
    )
    expect(JSON.stringify(content)).not.toMatch(/Some Street|Date of Birth/)
  })

  it('stores links without a scheme or trailing slash', () => {
    const { content } = parseResumeText(
      'Sam Rivera\nhttps://www.linkedin.com/in/samrivera/ | https://github.com/samrivera/ | https://samrivera.dev/\nSkills\nPython',
    )
    expect(content.contact).toMatchObject({
      linkedin: 'linkedin.com/in/samrivera',
      github: 'github.com/samrivera',
      website: 'samrivera.dev',
    })
  })
})

describe('stripPhones', () => {
  it('removes phone numbers in common formats but not dates', () => {
    expect(stripPhones('Call +1 (555) 010-0199 today')).not.toMatch(/555/)
    expect(stripPhones('Mobile: +44 20 7946 0958')).toBe('')
    expect(stripPhones('(555) 010-0199')).toBe('')
    expect(stripPhones('2023 - 2027')).toBe('2023 - 2027')
    expect(stripPhones('06/2024 – 08/2024')).toBe('06/2024 – 08/2024')
    expect(stripPhones('Mar 2024 | Coursera')).toBe('Mar 2024 | Coursera')
  })
})

describe('found in a real upload (the master resume printed to PDF)', () => {
  const text = `Syed Mehraj Ur Rahman
EXPERIENCE
Parallel Labs (Parcera) Hyderabad, India
Software Developer Intern Jul 2026 – Present
• Fine-tuned a 3-billion-parameter multilingual model; quality rose and placeholder tags were
preserved
100% of the time, up from 88%.
• Shipped every change.`
  it('keeps a city with its country and joins a wrapped line that starts with a number', () => {
    const it0 = parseResumeText(text).content.experience.items[0]
    expect(it0.company).toBe('Parallel Labs (Parcera)')
    expect(it0.location).toBe('Hyderabad, India')
    expect(it0.bullets.map((b) => b.text)).toEqual([
      'Fine-tuned a 3-billion-parameter multilingual model; quality rose and placeholder tags were preserved 100% of the time, up from 88%.',
      'Shipped every change.',
    ])
  })
})
