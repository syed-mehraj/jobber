# Jobber: step-by-step plan

A private, single-user workspace for Syed Mehraj Ur Rahman:

- **Resumes:** a master resume and tailored versions, in an editor where the form (left) and the live preview (right) stay in sync both ways.
- **Jobs:** a daily search of product companies' own career sites, filtered to roles he can realistically get and scored against each resume.
- **Applications:** a tracker for what was applied to, with which version.

The UI is specified in [DESIGN.md](DESIGN.md): blue and white on a dim background.

## Decisions

| Topic | Decision |
|---|---|
| Hosting | Vercel, private and password-protected; Postgres on Neon (free tier); Vercel Cron for the daily run |
| Alerts | Telegram bot, a morning digest |
| Locations | Hyderabad; Bengaluru, Pune, Gurugram, Chennai, Mumbai, Noida; remote (India-eligible); international |
| International roles | Kept, but checked: "must already be authorized to work" is dropped, "sponsorship available" is flagged |
| Voice agent employer | Parallel Labs / Parcera |
| AI | Gemini API, server-side only. Used to read and score jobs and to rewrite text, never to find job links |
| Repo | github.com/syed-mehraj/jobber (private). Every step is committed and pushed |

## How each step is shipped

1. Build the step on `main` in small commits.
2. Before each commit, the pre-commit hook (`.githooks/pre-commit`) checks for keys, tokens, database URLs with passwords, private keys and phone numbers.
3. Run the checks for the step (type check, tests, and a browser check for UI steps).
4. Commit with a message that says what changed, then push to `origin/main`.
5. From Phase 6 on, Vercel redeploys on every push.

## Keeping things private

- Real secrets live only in `.env.local` (git-ignored) and in Vercel's environment settings. `.env.example` lists names, never values.
- Nothing is sent to the browser except what the page needs. The Gemini key, the Telegram token and the database URL are server-only (no `NEXT_PUBLIC_` prefix).
- The app sits behind a password: a bcrypt hash in an environment variable, with an httpOnly, secure session cookie. Vercel Deployment Protection is on for previews.
- The cron endpoint requires `CRON_SECRET`. The Telegram bot only ever messages one chat ID.
- Resume content lives in the database, not the repo. The seed file holds only details already public on the portfolio (name, email, GitHub, education, projects). No phone number or address goes in the repo.
- Logs never print keys, tokens or full resumes.
- Design references from Dribbble or Mobbin are studied, not stored: no screenshots or copied assets in the repo.

## Phase 0: Foundations

**0.1 Repo and safety** *(this commit)*
- `.gitignore`, `.env.example`, the secret-blocking pre-commit hook, `docs/PLAN.md`, `docs/DESIGN.md`, and a visual design preview at `docs/design/preview.html`.
- Done when: the repo is pushed and still private.

**0.2 Fix npm on this Mac**
- npm hangs because this network's IPv6 route is broken; Node reaches the registry fine over IPv4. Either turn IPv6 off while installing (`networksetup -setv6off Wi-Fi`, undo with `-setv6automatic`) or route npm through a local IPv4 proxy.
- Done when: `npm view next version` answers.

**0.3 Scaffold**
- Next.js (App Router, TypeScript, strict mode), Tailwind, shadcn/ui, ESLint, Prettier, Vitest, Playwright.
- Done when: `npm run dev`, `npm run build` and `npm test` pass.

## Phase 1: Design system in code

**1.1 Tokens:** the colours, type scale, radii, shadows and motion from DESIGN.md as CSS variables and Tailwind theme values. Inter loaded with `next/font`.

**1.2 Components:** Button (6 variants × 3 sizes, every state), IconButton, Input, Textarea, Select, Badge, ScoreBadge, Card, Tabs, SegmentedControl, Dialog, Drawer, Toast, Tooltip, Skeleton, EmptyState.

**1.3 App shell:** sidebar, top bar, page container, a ⌘K command menu, and a phone layout.

**1.4 Style guide page:** a `/styleguide` route showing every component and state.
- Done when: it matches DESIGN.md and keyboard focus is visible everywhere.

## Phase 2: Data and access

**2.1 Database:** Prisma with these tables:
- `Resume`: master content as JSON
- `ResumeVersion`: selection, order and overrides
- `VersionSnapshot`: history
- `Job`, `JobScore`, `Company`, `Source`, `Application`, `Run`, `Setting`

**2.2 Login:** the password page, a session cookie, and middleware that protects every route except `/login` and the cron endpoint, which needs its own secret.

**2.3 Seed:** the master resume, built only from real work:
- Parallel Labs / Parcera: the voice ordering agent
- Steady: the NestJS microservices and the Expo / Kotlin app
- the portfolio
- AI Excel Analyst
- the ML projects: CNN, LSTM, ensembles, RAG, regit, cattle, heart, SU Hub

Unverified numbers or dates are marked `TODO` for Syed to fill in.

- Done when: logged-out visits redirect to `/login`, and the seed loads.

## Phase 3: Resume editor (the core)

**3.1 Resume schema:** typed sections (contact, summary, experience, projects, education, skills, certifications, custom). Every item and bullet has a stable ID.

**3.2 Editor state:** one store (Zustand) with undo and redo. Both panes read from it and write to it. Every field has a path, such as `experience[id].bullets[id]`.

**3.3 Left pane:** a section navigator (add, hide, reorder) and forms for each section. Bullets get a toolbar: move, delete, Improve ✦.

**3.4 Right pane:** the live A4 / Letter preview from the active template, scaled to fit.

**3.5 Right to left:** every text node in the preview is editable in place. Clicking one focuses and outlines the matching form field, and edits flow back through the store. Dragging a section or bullet on the preview reorders it.

**3.6 Saving:** autosave every 1.5s after a pause, a "Saved" indicator, and a snapshot when you leave a version.
- Done when: an edit on either side shows on the other in under 100ms. Covered by a Playwright test.

## Phase 4: Templates, export and versions

**4.1 Templates:** Simple, Compact, Classic and Modern, plus the style controls from DESIGN.md §6.

**4.2 PDF export:** a print stylesheet, then the browser's Save as PDF, with fonts embedded. A check that the text in the PDF can be selected and parsed.

**4.3 Versions:** create a version from the master, choose sections and bullets, override wording per version, duplicate, rename, archive, and diff two versions.

**4.4 Four sample versions:** ML / AI Engineer Intern, Backend SDE, GenAI / Voice AI, Full-stack.
- Done when: all four export to clean one-page PDFs.

## Phase 5: Scoring and AI help

**5.1 Resume checks without AI:** bullets with no numbers, weak verbs, length, missing sections, and date consistency. These feed the 0–100 score with a breakdown.

**5.2 Job targeting:** paste a job description or pick one from Jobs.
- Gemini extracts the required and preferred skills.
- The app shows matched and missing keywords, with Add / Skip.

**5.3 AI actions:** improve a bullet, tailor a version to a job, draft a cover letter.
- Results come back as a diff to accept or reject, never applied silently.
- Prompts require keeping to facts already in the master resume.
- Done when: AI calls run only on the server and cost is logged per call.

## Phase 6: Deploy early

**6.1** Link the repo to Vercel. Create the Neon database. Add the environment variables in Vercel. Run migrations and the seed.
- Done when: the private URL shows the login page, and the editor works in production.

## Phase 7: Job search

**7.1 Sources:** one adapter per source, each returning a common `JobPosting` shape:
- Greenhouse, Lever, Ashby and Workday boards
- Google, Amazon, Microsoft and Apple career search

Each adapter has its own test against a recorded sample. A failing source never stops the others.

**7.2 Companies:** about 40 product companies, each mapped to its source, editable in Settings.

**7.3 Hard filters (no AI):**
- level: internship, new grad 2027, or 0–1 years
- location: the list above
- work authorization rules
- degree and graduation year
- posted in the last 30 days
- duplicates removed by company, title and location

**7.4 Gemini scoring:** for each job that survives the filters:
- extract the requirements once and cache them
- score against each resume version, with fit reasons, gaps and the best version
- cap the batch size and cost per run

**7.5 Link check:** fetch every apply URL; drop anything that is gone or closed.

**7.6 Jobs page:** filters, a list, a detail drawer, "Tailor a version", and Apply (opens the company's own page and marks it Applied, with a confirmation).
- Done when: a manual run on production fills the Jobs page with real, live postings.

## Phase 8: Daily run and alerts

**8.1 Cron:** Vercel Cron once a day at 07:00 IST. It runs fetch → filter → score → link check, stores a `Run` record, and sends the digest.

**8.2 Telegram:** a bot made with @BotFather, and its token and chat ID stored in Vercel. The digest has:
- the count of new matches by category
- the top 10 matches, each with score, company, role, location, best resume and apply link
- a list of any sources that failed

Settings has a "Send test message" button.

**8.3 Run history:** a page showing each run's counts, errors, duration and AI cost.
- Done when: a morning digest arrives on Telegram with working links.

## Phase 9: Applications and dashboard

**9.1 Tracker:** a kanban (Saved → Applied → OA → Interview → Offer / Rejected), notes, dates, and the resume version used.

**9.2 Dashboard:** stat cards; jobs by category and by best resume version; today's top matches; follow-ups due.

**9.3 Polish:**
- empty states and loading skeletons
- the phone layout
- an accessibility pass
- a performance pass (Lighthouse 90+)
- Done when: the whole loop works — find a job, tailor a version, export, apply, track.

## Later

DOCX export; LinkedIn-profile import from a saved PDF; interview notes per application; a weekly summary.

## Still needed from Syed

- Title and dates at Parallel Labs / Parcera, and whether the i110Labs internship is a separate role (and what it covered).
- When we reach those phases: a Gemini API key, a Telegram bot token, and a Vercel login. All three go into environment settings, never into chat or the repo.
