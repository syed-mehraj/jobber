# Jobber: where jobs come from

Research done in November 2026, from two passes: a Gemini deep-research report shared by Syed, and a web research pass (official docs, hiring-data reports, Blind; Reddit itself refused automated reads, so Reddit opinions are second-hand).

The goal is the opposite of a mass portal: fewer listings, each one a role a 2027 CS graduate in Hyderabad can realistically get, reached as soon as it opens.

## Read automatically

Only sources that publish a public feed meant for this use. Each is read again whenever the app is opened and the last search is more than 10 minutes old (`REFRESH_MINUTES`), on "Run search now", and once a day by Vercel Cron.

| Source | Why | Feed |
|---|---|---|
| Company job boards on **Greenhouse, Lever, Ashby, SmartRecruiters** | Applications go straight to the company's recruiter, with nothing in between. Most Indian product companies and the startups on investor portfolio boards use one of these. | Public job-board APIs: Greenhouse ("authentication is not required for any GET endpoints"), Lever postings API, Ashby posting API, SmartRecruiters posting API |
| **Hacker News "Who is hiring?"** | Founders and CTOs post directly; little spam. Low volume for India (about 10 of 372 posts in Nov 2026). | Official Algolia HN API |
| **SimplifyJobs** new-grad and internship lists, **vanshb03** internship list | Updated many times a day, with a sponsorship field. Almost entirely US roles, so the filters keep very few. | Raw `listings.json` in public GitHub repos |

The company list is in `src/jobs/catalog.ts` (60 boards, verified 16 Nov 2026); its health is on Settings → Companies and sources. Greenhouse boards are listed without descriptions first, and descriptions are downloaded only for roles that could pass the filters.

Companies checked but not readable here (no board on these four systems): Amazon, Microsoft, Google, Apple, Meta, Uber, Atlassian (iCIMS); Adobe, Nvidia, Salesforce, PayPal, Mastercard, Visa, Intel, BrowserStack, Sprinklr (Workday); Flipkart, Ola, Setu (TurboHire); Rapido, Spinny (Darwinbox); Plum, SaaS Labs, Cashfree (Kula); Zoho, Rippling, PhonePe, Zerodha, Postman, Chargebee, CleverTap. Set email alerts on their career sites instead.

## Not read automatically, and why

| Site | Reason | Where it goes |
|---|---|---|
| LinkedIn, Wellfound, YC Work at a Startup, Cutshort, Internshala, Hirist | Their terms forbid bots and scraping | Programs page (check by hand); for YC, the companies' own Ashby/Greenhouse boards are read instead |
| Peak XV, Lightspeed, Accel, Elevation portfolio boards | Only internal APIs; no published feed | Programs page; their portfolio companies' own boards are read instead |
| Workday career sites, Amazon / Microsoft / Google / Apple / Atlassian search | Undocumented internal endpoints | Not used. Check those career sites directly |
| PM Internship Scheme | Listings sit behind an Aadhaar login; no feed | Programs page, with the eligibility rules |
| Instahyre, Geektrust, HackerEarth | Profile- or challenge-based; no feed for this use | Programs page |
| Unstop, Apna, Naukri | Excluded by choice: huge applicant piles (Flipkart GRiD 6.0: about 4.8 lakh registrants for 200 interview slots) | — |
| TopHire, Weekday | Serve senior roles (and hourly AI-training gigs) | Programs page, under Skip |
| Telegram job channels, paid "placement guarantee" courses | Reposts and a common scam route; paid access is never needed | Programs page, under Skip |

## Filters (no AI)

A posting is kept only if all of these hold (`src/jobs/filters.ts`):

- **Role:** software, ML / AI, data engineering, backend, frontend, full-stack, mobile or infra. Sales, design, support, hardware, management and similar are dropped.
- **Level:** internship, new grad / graduate / SDE I / junior, or a description asking for 0–1 years. Senior, staff, lead, "II/III" and 2+ years are dropped. Roles that don't state a level are kept but flagged and scored lower.
- **Intake:** titles naming 2026 or earlier are dropped.
- **Freshness:** older than 45 days is dropped. Roles open under 30 days get more replies (Pin's 2026 data: 11.3% vs 8.4% for roles open 90+ days).
- **Where:** Hyderabad, elsewhere in India, or remote that India can do. Abroad only for non-intern roles that offer visa sponsorship; internships abroad are dropped (they need enrolment or a visa there).
- **Work authorisation:** "must be authorized to work in…", citizenship, clearance or "no sponsorship" drop a role outside India.

## Match score

Keyword-based for now (`src/jobs/score.ts`): level (up to 32), location (up to 15), kind of role (up to 14), skills from your own work that the posting mentions (up to 30), and freshness (up to 8). Gemini scoring against each resume version replaces it in Phase 5.

## What the research says about getting hired

- Cold applying on LinkedIn converts at about 3%; Greenhouse data shows 27 applications per interview in 2026, up from 11 in 2021. Tailored applications convert about 2.1× better; 10–20 good applications a week beat mass applying.
- Referrals are a small share of applicants but a large share of hires. When a strong match appears, ask someone at the company before applying.
- Funding-triggered outreach (message engineers at startups that just raised Seed or Series A, with a deployed project) is the most-cited way past crowded portals.
- Read only official pages for scheme rules, and never pay for job access.
