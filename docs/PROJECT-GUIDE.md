# Jobber: everything we built

As of 23 Nov 2026 (accounts added; see [MULTI-USER-PLAN.md](MULTI-USER-PLAN.md) and [GOOGLE-SIGN-IN.md](GOOGLE-SIGN-IN.md)). Repo: `github.com/syed-mehraj/jobber` (private). This guide explains every part of the app: what it does, why it was built that way, which APIs it uses, how each flow works, and where the code lives.

Related docs: [PLAN.md](PLAN.md) (step-by-step plan), [DESIGN.md](DESIGN.md) (design system), [DASHBOARD.md](DASHBOARD.md), [SOURCES.md](SOURCES.md) (job sources and why), [ABROAD.md](ABROAD.md) (country research).

---

## 1. What Jobber is

A private, invite-only web app, built for one job seeker (Syed: B.E. AI & ML, MJCET / Osmania University, graduating 2027, AI Engineer at Parcera) who can invite others. Each person has their own account (Google or email + password) and their own resumes, About you, applications and match scores; the job search is shared. It does three things:

1. **Resumes:** keeps a master resume and versions tailored per role, in an editor where you edit directly on the page.
2. **Jobs:** searches 270+ company job boards and lists only roles a 2027 graduate can realistically get, in India, remote, and abroad with visa or relocation support.
3. **Applications:** tracks what you applied to and at what stage.

### Stack

| Part | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, Cache Components / Partial Prerendering, Turbopack), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4; design tokens in `src/app/globals.css` (blue and white on a dim grey canvas, Inter font) |
| Database | Postgres through Drizzle ORM. Locally **PGlite** (a real Postgres running inside the app, stored in `.data/pglite`); in production **Neon** via `DATABASE_URL` |
| AI | Google **Gemini API** (server-side only) |
| File reading | **unpdf** (PDF text) and **mammoth** (Word .docx text) |
| Tests | Vitest + Testing Library: 176 tests. Browser checks with Playwright + Chrome during development |
| Hosting | Live at https://jobber-ten-silk.vercel.app (Vercel, region Mumbai/Singapore `sin1`, Neon Postgres, daily cron); locally on `http://localhost:3000` (or 3001) with PGlite |

### Principles we kept throughout
- Show only roles worth applying to (filters before scores).
- Never invent facts (the AI may not add numbers, tools, employers or dates).
- Secrets never go in the code, the repo or the browser.
- Prefer official, documented data sources; anything unofficial is labelled.
- Every change is tested, committed and pushed.

---

## 2. Running it

1. In the `jobber` folder: `npm install`.
   On this Mac npm needs: `NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"` (your traffic goes through a VPN tunnel and Node's automatic IPv4/IPv6 choice times out).
2. In `.env.local` set `OWNER_EMAIL`, `OWNER_NAME`, `OWNER_PASSWORD_HASH` (how to make the hash is in `.env.example`), `SESSION_SECRET` and `CRON_SECRET`. The owner is the only admin.
3. `npm run dev` → open `http://localhost:3000` → sign in with the owner email and password. The owner account is created when the app starts, and everything stored before accounts moves into it. There is no setup page.
4. Invite people on **People and invites** (`/admin`, in the ☰ menu): enter their email → copy the link → send it. The first visit starts a job search; refresh after a minute.
5. Optional: add `GEMINI_API_KEY=your-key` to `.env.local`, restart → the AI assistant and smarter upload parsing turn on.
6. Optional: Google sign-in → follow [GOOGLE-SIGN-IN.md](GOOGLE-SIGN-IN.md) to add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Checks: `npm test` · `npm run lint` · `npm run typecheck` · `npm run build`.

| Variable in `.env.local` (git-ignored) | What it's for |
|---|---|
| `OWNER_EMAIL`, `OWNER_NAME`, `OWNER_PASSWORD_HASH` | the owner, the only admin: created or updated from these on start; the password only as a Better Auth scrypt hash (a new hash changes the password and signs the owner out) |
| `SESSION_SECRET` | signs sign-in sessions (Better Auth's secret; `BETTER_AUTH_SECRET` overrides it) |
| `BETTER_AUTH_URL` | the site's address, e.g. `https://jobber-ten-silk.vercel.app`; optional locally (any `localhost` port works) and on Vercel (the production address is used) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Continue with Google"; hidden when unset ([GOOGLE-SIGN-IN.md](GOOGLE-SIGN-IN.md)) |
| `CRON_SECRET` | key for the scheduled-search endpoint `/api/cron` |
| `DATABASE_URL` | empty locally (PGlite); Neon connection string on Vercel |
| `REFRESH_MINUTES` | minutes between automatic searches while you use the app (default 10) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI features; model defaults to `gemini-2.5-flash` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | reserved for the daily digest (not built yet) |

---

## 3. The app: pages and flows

**Header** (only what you use most): Dashboard · Resumes · About you · Jobs · **New resume** · ☰. On phones the links move into the ☰ menu.
**Menu slider** (☰, from the right): every page with counts, Programs and other sites, Job search status + **Run search now**, Settings (Companies and sources, Roles and locations, Telegram alerts, Style guide), Sign out.

| Page | Route | What you do there |
|---|---|---|
| Sign in | `/login` | Email + password, or **Continue with Google** |
| Create account | `/signup?invite=…` | From an invite link: name + password, or Google with the invited email |
| People and invites (admin) | `/admin` | Invite by email (link shown once, 14 days, single use), open invites (Revoke), people (Remove) |
| Dashboard | `/` | Greeting (India time), 3 stat cards with context (open matches + "new today", applied + "waiting to hear back", tests & interviews), today's 5 best matches |
| Jobs | `/jobs` | Tabs **India & remote** / **Abroad · visa or relocation**; filter chips; list + fit panel; J/K to move |
| Resumes | `/resumes` | Resume cards, attached original files (Download), Upload button |
| New resume | `/resumes/new` | **Make a version** (copy master / copy a version / blank) or **Upload a resume** |
| Resume view | `/resumes/[id]` | The page in its style; Edit; Save as PDF |
| Editor | `/resumes/[id]/edit` | Full-width editor, zoom, close-up, fonts, styles, AI assistant, Save |
| About you | `/about` | Several descriptions of your work, one per kind of application |
| Applications | `/applications` | Roles you applied to, with a stage each |
| Programs and other sites | `/programs` | Schemes and sites the app can't read automatically |
| Companies and sources (admin) | `/settings/companies` | Every source: postings seen, roles kept, OK / Failing, Unofficial badge |
| Style guide | `/styleguide` | Every colour, size, button, input state. Local development only (`npm run dev`); not on the live site |

### Flow: find and apply to a job
```
open app ──► search older than 10 min? ──yes──► search runs in the background (results on next refresh)
   │
   ▼
Jobs ─► tab (India & remote / Abroad) ─► filters ─► click a role
   │
   ▼
Fit panel: why it matched · skills you have / lack · Resume advice (AI) · where Apply goes · description
   │
   ├─► "Get resume advice" ─► Gemini compares the role with your master resume + About you ─► fit, "lead with", gaps,
   │      reworded lines (tick the ones you want) ─► "Create tailored resume" ─► new resume "<role> – <company>" in the editor
   ├─► "Apply on Greenhouse" ─► company page opens in a new tab ─► "Did you apply?" ─► Yes ─► Applications
   └─► "Not for me" ─► hidden (Restore brings it back)
```

### Flow: make a tailored resume
```
New resume ─► name + "for" ─► start from master / a version / blank ─► Editor
   └─ or Upload a resume (PDF/Word) ─► text read into sections ─► Editor ("Imported from …" note)

Editor: click a line / entry / section heading ─► edit on the page or in the close-up
        ─► pick font + style ─► AI assistant: prompt ─► accept / skip each suggestion
        ─► Save (⌘S) ─► Preview & PDF ─► Save as PDF
```

### Flow: sign in (owner and everyone else)
```
Owner:  OWNER_EMAIL + OWNER_PASSWORD_HASH in .env.local / Vercel
        ─► app starts ─► owner account created (or password synced) ─► /login with that email + password ─► Dashboard (admin)
Others: /login ─► email + password (eye button shows/hides it; spaces at either end are ignored)
        or "Continue with Google" (only for an invited email, once Google keys are added)
Wrong password ─► "That email or password is not right."   10 wrong tries in 5 min from one network ─► "Too many tries"
```

### Flow: invite someone (admin only)
```
☰ ─► People and invites ─► their email ─► Create invite link ─► copy the link (shown once) ─► send it to them
They open /signup?invite=… ─► name + password (or Google with that email) ─► their own empty Jobber
  · link works once, for 14 days · Revoke it any time · Remove a person = their account and all their data deleted
They get: own resumes, About you, applications, match scores. Shared: the job list (official boards only).
```

### Flow: how a change goes live
```
Change the code on the Mac ─► npm test · lint · typecheck · build ─► check in the browser (localhost)
  ─► commit as syed-mehraj ─► push to github.com/syed-mehraj/jobber (private)
  ─► vercel deploy --prod (uploads this folder; Vercel isn't connected to GitHub, so a push alone changes nothing live)
  ─► check https://jobber-ten-silk.vercel.app
```

---

## 4. Where jobs come from (APIs and data sources)

Most companies don't run their own jobs API. They post jobs in a hiring system (an "ATS"), and that system publishes a **free, public, documented feed per company**: a URL that returns the company's open jobs as JSON. No key or login. Jobber reads those feeds. Apply links always go to the company's own posting.

### 4.1 Official, documented feeds (read automatically)

| Source | Endpoint | Used for |
|---|---|---|
| **Greenhouse** Job Board API | `GET https://boards-api.greenhouse.io/v1/boards/{board}/jobs` and `/jobs/{id}` for the description | ~70 company boards (Stripe, Databricks, MongoDB, Razorpay, Groww, Okta, OpenAI-adjacent, Pure Storage…) |
| **Lever** Postings API | `GET https://api.lever.co/v0/postings/{site}?mode=json` (EU: `api.eu.lever.co`) | CRED, Meesho, Zeta, Paytm, Veeva, Coupa… |
| **Ashby** Posting API | `GET https://api.ashbyhq.com/posting-api/job-board/{board}` | Sarvam AI, Atlan, Notion, Snowflake, Mistral… |
| **SmartRecruiters** Posting API | `GET https://api.smartrecruiters.com/v1/companies/{id}/postings?country=in` | Swiggy, Freshworks, ServiceNow, ixigo, Arista… |
| **Hacker News** (Algolia API) | `https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring` then `/items/{id}` | The monthly "Ask HN: Who is hiring?" thread |
| **GitHub lists** (raw JSON) | `https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/.github/scripts/listings.json`, `…/SimplifyJobs/Summer2027-Internships/…`, `…/vanshb03/Summer2027-Internships/…` | Community-maintained new-grad and internship lists (mostly US) |
| **Arbeitnow** Job Board API | `https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true` | Visa-sponsored jobs in Germany/Europe (its terms ask for a link back, so its jobs open on arbeitnow.com) |

Three catalogs list the boards (verified by subagents against the live APIs):

| File | Boards | Focus |
|---|---|---|
| `src/jobs/catalog.ts` | 130 + 5 aggregated feeds | Product companies, 109 with India roles on 16 Nov 2026 |
| `src/jobs/catalog-international.ts` | 135 | Companies in target countries (DE 24, GB 21, US 20, CA 14, AU 8, CH 5, SG 5, NL 4…) |
| `src/jobs/catalog-unofficial.ts` | 4 | Big tech (below) |

### 4.2 Unofficial (your choice, labelled "unofficial")
Google, Microsoft, Amazon and Netflix publish no feed. At your request the app reads the data their own careers pages load, for personal use, **at most once an hour**, marked "unofficial" on rows, the fit panel and the Sources page. These may break or be blocked, and their site terms generally forbid automated reading.

| Company | What is read |
|---|---|
| Amazon | `https://www.amazon.jobs/en/search.json?base_query=…&normalized_country_code[]=IND` (5 searches) |
| Google | The Google Careers results page's embedded data (`AF_initDataCallback` "ds:1"), India, early-career + intern |
| Microsoft | `https://apply.careers.microsoft.com/api/pcsx/search` (Eightfold), India, 3 searches × 3 pages, 1.5 s apart |
| Netflix | `https://explore.jobs.netflix.net/api/apply/v2/jobs` (Eightfold), India |

Microsoft and Netflix (both on Eightfold) answered HTTP 429 "try again later" after repeated test runs; the hourly limit lets them recover.

### 4.3 Not read, and why
| Site | Reason |
|---|---|
| LinkedIn, Wellfound, YC Work at a Startup, Cutshort, Internshala, Hirist, Instahyre | Their terms forbid bots/scraping → listed on the Programs page to check by hand |
| Peak XV, Lightspeed, Accel, Elevation portfolio boards | Only internal APIs (probing them was blocked) → their portfolio companies' own boards are read instead |
| Workday sites (Adobe, Nvidia, Salesforce, PayPal, Intel, Walmart, Qualcomm…) | Internal endpoints; probing them was blocked in the agent session |
| Flipkart (TurboHire) | Its page only returns jobs after issuing a temporary access token — a deliberate gate, not bypassed |
| Apple, Meta, Uber | No readable job data |
| Unstop, Apna, Naukri | Excluded by your choice (huge applicant piles) |
| PM Internship Scheme | Listings behind an Aadhaar login → Programs page with eligibility rules |

---

## 5. How a job search runs

**Triggers:** opening Dashboard or Jobs when the last search is older than `REFRESH_MINUTES` (default 10) → runs **after the response** (Next.js `after()`), so the page loads instantly and the next refresh shows results · **Run search now** (menu or Jobs page) · `GET /api/cron` with `Authorization: Bearer CRON_SECRET` (Vercel Cron, daily at 07:00 IST in `vercel.json`).

```
runSearch(trigger)                                         src/jobs/run.ts
 │ 1. lock: skip if another run started < 10 min ago
 │ 2. load profile = stored skills + every skill found in the master resume + "About you"
 │ 3. sources = enabled rows; unofficial ones only if last read ≥ 60 min ago
 │ 4. 12 sources at a time (worker pool); one failing source never stops the rest
 ▼
 for each source ─► adapter (src/jobs/adapters/*) ─► RawPosting[] {id, company, title, location, url, postedAt, description?, hints}
     Greenhouse: list (small) ─► worthDetail(title, location)? ─► fetch description (≤ 60 per board,
                 cached in memory by board + id + updated_at, so repeat searches skip unchanged jobs)
 ▼
 classify(posting)  (hard filters, no AI)  ─► drop, or keep with level / region / category / flags
 ▼
 scoreJob(posting)  ─► score 0–99, matched skills, missing skills, required skills, reasons
 ▼
 merge duplicates (same title + location within a source)
 ▼
 upsert into jobs (new → firstSeenAt now; seen before → updated; "Not for me" stays hidden)
 ▼
 close jobs from this source that weren't seen this run (taken down)  — skipped if the source returned 0
 ▼
 record the run (sources ok/failed, seen, kept, added, closed, errors) + each source's health
```

Measured: 274 sources in about 60 s on the first run; about 25 s on repeat runs (description cache). One real run on your database: 269 of 270 sources OK, 34,110 postings read, 83 kept, 53 new.

---

## 6. Filter and scoring rules

### 6.1 Hard filters (`src/jobs/filters.ts`)
A posting is kept only if **all** hold:

| Check | Kept | Dropped |
|---|---|---|
| Role | software, ML/AI, data, backend, frontend, full-stack, mobile, infra, research(er) | sales, design, support, HR, finance, hardware, propulsion/HVAC/chemical, admin, ServiceNow/Salesforce/SAP, consultants, language gigs (native speaker, annotation, speech tester) |
| Level | intern, new grad / graduate / SDE I / junior, "0–1 years" | senior, staff, lead, manager, director, architect (incl. "Architekt"), "Intermediate", "Confirmed", SDE-II / "Engineer - 3", 2+ years asked, PhD/MBA-only |
| Intake | 2027 or no year | titles naming 2026 or earlier |
| Freshness | posted in the last 45 days | older |
| India | Hyderabad, other Indian cities, remote that India can do | remote tied to US/EU/UK only; "must be authorised to work in…" |
| Abroad | not an internship or local-student scheme; offers **visa sponsorship** or **relocation support**; English role | needs existing work rights, needs German/French/Dutch, Werkstudent/alternance, level not stated without explicit visa |
| Strict sources (HN) | must say intern / junior / new grad | closed posts ("no longer taking applications") |

Roles with no stated level in India are kept but flagged "Experience not stated".

### 6.2 Match score (`src/jobs/score.ts`), 0–99, keyword-based until Gemini scoring is added
| Part | Points |
|---|---|
| Level | new grad 32 · intern 30 · entry 28 · not stated 14 |
| Location | Hyderabad 15 · India 12 · remote 12 · abroad 6 |
| Kind of role | preferred (ML/AI, Backend, SDE, Full-stack) 14 · other 8 |
| Skills | with ≥ 3 known skills in the posting: coverage × 30 (matched ÷ required); otherwise 6 per match (max 30); no description: 10 |
| Freshness | ≤ 2 days 8 · ≤ 7 days 5 · ≤ 14 days 2 |

Colours: 80+ green, 60–79 grey, 40–59 amber, below 40 red. Blue is never used for a score (blue = clickable).

### 6.3 Skills dictionary (`src/jobs/skills.ts`)
About 207 canonical skills in 10 groups with aliases (`k8s` → kubernetes, `nodejs` → node.js, `ml` → machine learning…). Ambiguous words ("Go", "rest", "Spark", "Swift", "React") only count in tech context, so "Go beyond" or "the rest of the team" don't match. It produces **required** (what the posting names), **matched** (what your profile covers) and **missing** (shown as amber chips in the fit panel).

Your profile = the stored skill list + every skill found anywhere in the master resume (summary, bullets, stacks) + every "About you" description, except skills a description says you haven't used ("I haven't administered Salesforce…").

---

## 7. The Abroad section

**Jobs → Abroad · visa or relocation** shows roles in other countries whose postings offer visa sponsorship or relocation support. It has country chips with counts and flags, and a country guide at the top.

**Country detection** (`src/jobs/countries.ts`): each job's location is matched to 28 countries (city and country names, US state codes, Dutch "Nederland"); the first place named wins. Stored in `jobs.country`.

**Country guide** (`src/lib/countries-guide.ts`, from [ABROAD.md](ABROAD.md)): 23 countries ranked for a 2027 Indian graduate on visa realism, junior pay (local + INR), tax, safety (Global Peace Index), friendliness (Expat Insider), competition, language, life there, with sources.

| Rank | Country | Visa for you | Why |
|---|---|---|---|
| 1 | Germany | Medium-High | EU Blue Card reduced threshold €45,934 (IT / recent grads), Opportunity Card fallback; check Osmania on anabin |
| 2 | Ireland | Medium | Critical Skills permit €36,848 if applying within 12 months of graduating; English |
| 3 | Netherlands | Medium | Highly Skilled Migrant, under-30 threshold €4,357/month; needs a recognised sponsor |
| 4 | UAE | High (visa) | Fast visa, 0% tax; lower pay, no citizenship path, regional war risk |
| 5 | Denmark | Medium | Software on the Positive List; confirm a 3-year B.E. counts |
| … | US / Switzerland / Canada | Low | H-1B lottery + $100,000 fee for hires abroad; Swiss quotas; Canada points too high |
| … | Kuwait | High visa, small market | Easy employer visa, tax-free, but last in the expat survey; UAE is the better Gulf option |

Caveats from the research: several official sites blocked automated reading, so some figures come from secondary sources (marked); pay figures are aggregator estimates; company lists are from general knowledge, not sponsor registers.

---

## 8. The resume editor

Laid out from your sketch: **the resume fills the left; every edit is on the right**.

```
┌ toolbar: ← Resumes · name · For · undo/redo · + Add · Preview & PDF · Discard · Save ┐
├───────────────────────────────────────────────┬─────────────────────────────────────┤
│  zoom: −  179%  +  Fit  100%                   │ Edit line / Edit entry / Edit section│
│                                               │  larger preview of the selection     │
│   THE RESUME PAGE (A4, scaled to fit)          │  its fields (two-way sync)           │
│   click a line   → edit just that line         │  bullet tools ↑ ↓ ×, + Bullet        │
│   click an entry → edit the whole entry        │  Save changes                        │
│   click a heading→ edit the whole section      ├─────────────────────────────────────┤
│   Enter = new bullet, Backspace on empty =     │ Fonts (6)                            │
│   remove bullet, ⌘Z / ⇧⌘Z undo/redo            │ Resume style (6 + blue/black accent) │
│                                               │                     [✦ AI assistant] │
└───────────────────────────────────────────────┴─────────────────────────────────────┘
```

**How editing on the page works:** every piece of text in the template has a `data-path` such as `experience.<id>.bullets.<id>` (`src/resume/paths.ts` reads and writes any field by its path). The page is `contentEditable="plaintext-only"`. While you type, the page keeps showing the text it had when focus started, so React never rewrites under your cursor; the store and the close-up get every keystroke. If you empty a field, the page is rebuilt on blur so React owns the text again.

**Selection levels:** line (one field: large textarea + bullet tools), entry (all of its fields + Remove this entry), section (show/hide, move up/down, list of entries, + Add entry). Breadcrumbs widen the selection.

**Styles and fonts** (`src/resume/design.ts`, `render.tsx`, `themes.ts`, `fonts.ts`): 6 templates (Simple, Compact, Classic, Modern, Bold, Minimal), all single-column and ATS-safe; 6 fonts via `next/font` (Inter, Source Serif 4, Lato, Roboto, IBM Plex Sans, EB Garamond); blue or black accent. The Style panel shows live thumbnails of your own resume.

**Saving:** changes are a draft until **Save** (toolbar, close-up, or ⌘S). **Discard** returns to the last save (with a confirm). Leaving with unsaved changes asks first. Undo/redo groups typing in one field into one step.

**New resume** (`/resumes/new`): name, optional "for", start from the master, a copy of a version, or blank (your contact details + education only). **+ Add** adds an experience, project, education entry, skill group, certification or extra bullet.

**Preview & PDF** (`/resumes/[id]`): the page in its style; Save as PDF uses the browser's print with a print stylesheet that prints only the page (A4).

---

## 9. The AI assistant

A small box at the bottom right of the editor. Type what you want ("make the bullets more impact-focused"), choose **Whole resume** or the **selected** line / entry / section, optionally paste a **job description** to tailor to. Suggestions come back as before → after; nothing changes until you **Accept** (or Accept all); ⌘Z undoes.

| Part | Detail |
|---|---|
| API | Google Gemini REST: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, header `x-goog-api-key`, JSON response schema, temperature 0.4, 45 s timeout |
| Where | Server only (`src/lib/ai/gemini.ts`, server action `src/app/(app)/resumes/ai-actions.ts`); the key never reaches the browser and is never logged |
| Prompt rules (`src/resume/ai.ts`) | Edit only the listed paths; stay within facts in the resume and "About you"; never add a number, tool, employer, title, degree or date; if a fact is missing, write "[add number]"; plain ATS text, strong verbs, ≤ 2 lines per bullet; never touch email/GitHub/LinkedIn/website |
| Validation | Drops suggestions with unknown or disallowed paths, contact links, empty/identical/too-long text, duplicates; strips markdown; max 12 |
| Limits | Prompt ≤ 1000 characters, job description ≤ 8000; per person: 20 calls per 10 minutes and **30 a day (admin 200)**, reset at midnight India time (`ai_usage` table, `src/lib/ai/limits.ts`). Uploads read with Gemini count too; past the limit the built-in parser reads them |
| Logging | One line per call: model, tokens in/out, duration (no prompt text, no key) |
| Without a key | Shows "Add GEMINI_API_KEY to .env.local to use the assistant." |


### 9.1 Resume advice for a job (Jobs page)

Click a job → **Resume advice (AI) → Get resume advice**. One Gemini call (same key and limits as the editor assistant) reads the posting (title, skills it names, description up to 8000 characters) next to your **master resume** and **About you**, and returns:

| Part | What it is |
|---|---|
| Fit | Strong fit / Good fit / A stretch, with one or two honest sentences |
| Lead with | What already in your resume to put first for this role |
| Gaps to be honest about | What the posting asks for that your resume doesn't show, and whether to add it if true or learn it |
| Reworded lines | Up to 8 rewrites of existing lines so the real work reads closer to the posting; tick the ones you want |

**Create tailored resume** copies your master, applies only the ticked lines and opens it in the editor, named "<role> – <company>" with the company as its target. Your master is never changed, and nothing is saved before that click. Code: `src/jobs/advice.ts` (prompt and checks), `src/app/(app)/jobs/advice-actions.ts` (`adviseForJob`, `createTailoredResume`), `src/components/jobs/job-advice.tsx`.

Safety checks, enforced in code and not only asked of the model: the posting is treated as untrusted (instructions inside it are ignored); a rewrite is dropped if it targets an unknown path, a contact link or a "TODO" placeholder, or brings in a skill that appears nowhere in your resume or About you; markdown is stripped; the copy re-validates every ticked line on the server. Gemini's "thinking" is capped at 1024 tokens and the answer budget is 8192, so long postings don't cut the answer off (`generateJson` reports a cut-off clearly).
---

## 10. Uploading a resume

**New resume → Upload a resume**: choose a PDF, Word (.docx) or text file (≤ 5 MB), optional name and "for", then **Open it in the editor** or **Just save it**.

```
file ─► extractText (src/resume/import/extract.ts)
          PDF  → unpdf (pdf.js) text items, lines rebuilt from their positions
          DOCX → mammoth.extractRawText
          TXT  → UTF-8
     ─► GEMINI_API_KEY set? ─yes─► aiParseResume: Gemini copies the text into the resume structure (no rewriting)
                            └no──► parseResumeText: built-in parser
     ─► new resume row (editable content) + original file in resume_files
     ─► "edit": editor with an "Imported from <file>" note · "save": back to Resumes (card shows 📎 file + Download)
```

**Built-in parser** (`src/resume/import/parse.ts`): finds headings (Summary/Profile, Experience/Internships, Projects, Education, Skills, Certifications/Awards, others → an extra section); splits entries, roles and companies ("Role at Company", "Company | Role", "Company — Role"); pulls date ranges into start/end; keeps a city with its country; joins wrapped bullet lines; reads "Label: a, b, c" skill groups; **never stores phone numbers**. It returns warnings for anything it couldn't place.

Tested end to end: your master resume printed to PDF and uploaded came back with your name, contact, summary, both experiences with dates, projects, education and 6 skill groups. Two read errors found that way were fixed (a city attached to the company; a wrapped line starting with "100%").

**Download:** `GET /resumes/[id]/file` (signed-in only, `no-store`) returns the original file.

---

## 11. About you, Programs, Applications, Dashboard

**About you** (`/about`, `abouts` table): several descriptions of your work in your own words, one per kind of application (title, optional "for", text). Open one → Copy, Edit, Duplicate, Delete (with confirmation); **+ New**. Your Parcera description is the first entry. Matching reads all of them.

**Programs and other sites** (`/programs`, `src/lib/programs.ts`): things that can't be fetched automatically, each with a verdict (Check now / Plan for it / Depends on you / Not eligible / Skip):
- **PM Internship Scheme:** final-year students eligible since Apr 2026 with a college NOC; excluded if at an IIT/IIIT/IIM/NLU/IISER/NID, family income over ₹8 lakh, or a permanent government employee in the family; ≥ ₹9,000/month; Aadhaar login, no feed.
- GSoC (≈ March), LFX Mentorship (Jan/Apr/Jul), Outreachy (conditions), NITI Aayog (1st–10th monthly), ISRO NRSC Hyderabad, MeitY/NIC; Google STEP / SRFP / RBI not eligible.
- Sites to check by hand: YC jobs, Wellfound, Peak XV / Lightspeed / Accel boards, HackerEarth, Geektrust (3 attempts), Instahyre, r/developersIndia threads, recently funded startups; career sites the app can't read (Flipkart, Workday companies…).
- Skip: Unstop, Apna, Naukri, TopHire, Weekday, paid "placement guarantee" courses, Telegram job channels.

**Applications** (`/applications`): every role you answered "Yes" to, with a stage (Applied, Online test, Interview, Offer, Rejected, Saved) and Remove.

**Dashboard** (`/`): stat cards carry their own context so numbers never contradict ("+N new today"); the lead line says when sources were last checked; top 5 matches link into the Jobs fit panel.

---

## 12. Accounts, sign-in, privacy and security

**Who can get in:** invite-only. The owner (the only admin) is set in the environment: `OWNER_EMAIL` + `OWNER_PASSWORD_HASH` (`src/lib/auth/owner.ts`); the account is created or updated from them when the app starts. The admin invites people by email on `/admin`; each person opens their link and either sets a password or uses Google with that email. Google sign-in for an email without an invite is refused ("That Google account has no invite").

**What is shared and what is yours:**

| Shared | Per person |
|---|---|
| Job sources, the jobs found, search runs | Resumes and uploaded files, About you, applications, skills profile, match scores, dismissed jobs, AI usage |

Unofficial big-tech jobs (Amazon, Google, Microsoft, Netflix) are shown only to the admin; everyone else sees official boards only. Each person's scores are worked out against their own master resume and About you, after every search and right after they edit either.

| What | How |
|---|---|
| Library | Better Auth 1.7.25 (`src/lib/auth/auth.ts`), Drizzle adapter, sessions in the database, 30 days |
| Passwords | Better Auth's scrypt hashing; 10–128 characters |
| Google | OAuth with state + PKCE; callback `/api/auth/callback/google`; signing in with Google using an existing account's email links Google to it |
| Sign-up | The public sign-up endpoint is disabled. Accounts are created only by the invite server action (`src/app/login/actions.ts`) and, for the owner, from the environment, inside a gate that a database hook checks; Google creates one only for an invited email |
| Invites | 32 random bytes in the link; only a SHA-256 hash stored; single use; 14 days; revocable |
| Roles | `admin` (the owner) or `user`; can't be set from a request. Admin needs **both** the admin role **and** the `OWNER_EMAIL` address, so nobody else can be admin even if the database says so; anyone else marked admin is turned into a user on start. Admin-only: `/admin`, Companies and sources, unofficial jobs |
| Route protection | `src/proxy.ts` redirects requests without a session cookie; every data read and server action checks the session in the database (`requireUser` / `requireAdmin`) and filters by the person's id; updates and deletes use id **and** owner |
| Rate limits | Sign-in 10 tries per 5 minutes per IP (stored in the database, so it holds across Vercel instances); AI as in §9 |
| Google | Only accounts whose email Google marks verified; Google's tokens are encrypted at rest (XChaCha20-Poly1305) |
| Storage caps | Per person: 50 resumes, 20 uploaded files / 40 MB |
| Headers | `X-Frame-Options: DENY` + `frame-ancestors 'none'` (no clickjacking), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (invite links don't leak in Referer) |
| Reviewed | An independent review (23 Nov 2026) found no high-severity issues; the low ones above were fixed. Known limits: sign-in rate limit is per IP, not per email; no password reset by email yet |
| Removing someone | Deletes their account, sessions and all their data (cascade); open sessions stop working at once |
| Cron | `/api/cron` needs `Authorization: Bearer CRON_SECRET` (constant-time compare) |
| Secrets | Only in `.env.local` / Vercel settings; none prefixed `NEXT_PUBLIC_`; Gemini key server-only and never logged |
| Pre-commit hook | `.githooks/pre-commit` blocks keys (Google, Telegram), DB URLs with passwords, private keys, `token/secret/password =` assignments and Indian phone numbers |
| Personal data | No phone number or address in the repo; the parser drops phone numbers from uploads |
| Password boxes | Eye button to show/hide; spaces at either end are ignored on sign-in and sign-up; the sign-in form posts, so a password typed before the page script loads never lands in the URL |
| Repo | Private; visibility never changed |

---

## 13. Database

Drizzle schema in `src/db/schema.ts`; SQL migrations in `drizzle/` (0000–0009).

| Table | Holds |
|---|---|
| `sources` | Every job source: kind, config, enabled, last run / success / error, postings seen / kept |
| `jobs` | Kept postings (shared): title, company, location, region, country, level, category, url, dates, required skills, flags, summary, closed. (Its old score / matched / missing / dismissed columns are no longer read.) |
| `job_matches` | Per person and job: score, matched / missing skills, reasons, dismissed |
| `runs` | Each search: trigger, start/finish, sources ok/failed, seen/kept/added/closed, errors |
| `applications` | Owner + job + stage + dates + notes (one per person and job) |
| `resumes` | Owner, name, master flag, content (JSON with stable ids), design (template/font/accent), target |
| `resume_files` | Owner + uploaded original (bytea), linked to a resume |
| `abouts` | Owner + "About you" descriptions |
| `profiles` | Per person: skills and preferred job categories for scoring |
| `ai_usage` | Per person and day: AI requests used |
| `users`, `sessions`, `accounts`, `verifications`, `rate_limits` | Better Auth: people (with `role`), sign-in sessions, sign-in methods (password hash or Google), OAuth state, rate limits |
| `invites` | Invited email, token hash, who invited, expiry, used by / when |
| `settings` | Key/value: the old single matching profile (copied to the owner on setup) |

**Local vs production:** without `DATABASE_URL` the app uses PGlite in `.data/pglite` (git-ignored); with it, node-postgres to Neon. Migrations apply on first use and **again automatically if new migrations appear while the app runs** (fix for the "column jobs.country does not exist" error). The source catalogs are synced on startup; personal data is created per account (`src/lib/auth/onboard.ts`).

---

## 14. Code map

```
src/
  app/
    layout.tsx, globals.css                 root layout, Inter font, design tokens
    login/                                  sign-in page + actions (invite sign-up, sign out)
    signup/                                 create an account from an invite
    api/auth/[...all]/route.ts              Better Auth endpoints (sign-in, Google callback, session…)
    api/cron/route.ts                       scheduled search (CRON_SECRET)
    (app)/admin/                            People and invites (admin)
    (app)/layout.tsx                        header + menu slider, page container
    (app)/page.tsx                          Dashboard
    (app)/jobs/page.tsx                     Jobs (tabs, chips, list + fit panel)
    (app)/applications/page.tsx             Applications
    (app)/about/                            About you page + actions
    (app)/resumes/                          list, new, [id] view, [id]/edit, [id]/file, actions, upload-actions, ai-actions
    (app)/programs/, settings/, styleguide/
  components/
    shell/                                  header, menu drawer, menu state, header fallback
    auth/, admin/                           sign-in card and account form; invite form, confirm button
    ui/                                     Button, Card, Badge, Input, EmptyState, Skeleton, icons
    jobs/                                   job row, fit panel, dismiss, run-search button, country guide, J/K keys
    editor/                                 editor, close-up, design panels, AI assistant, history (undo), forms
    resume/                                 about section, template thumbnail, print button
  db/                                       schema, connection (PGlite/Neon + migrations), seed, test helper
  jobs/
    adapters/                               greenhouse, lever, ashby, smartrecruiters, hackernews, simplify, arbeitnow, amazon, google, eightfold
    catalog*.ts                             official, international, unofficial sources
    filters.ts, score.ts, skills.ts         rules, scoring, skills dictionary
    countries.ts, run.ts, unofficial.ts
    matches.ts                              per-person profiles and scores (job_matches)
  resume/
    types.ts, paths.ts, edit-ops.ts         content model, field paths, edits
    render.tsx, themes.ts, design.ts, fonts.ts   templates and fonts
    master.ts, about.ts                     your master resume and first About-you text
    ai.ts, import/                          AI prompt/validation; upload extract/parse/ai-parse
  lib/auth/                                 auth.ts (Better Auth), session.ts (getUser/requireUser/requireAdmin), invites, gate, owner (owner account from the environment), onboard (owner claim, new-person start), client
  lib/                                      data access, admin reads, AI limits, format, programs, countries guide, resumes, Gemini client
  proxy.ts                                  route protection
docs/                                       PLAN, DESIGN, DASHBOARD, SOURCES, ABROAD, MULTI-USER-PLAN, GOOGLE-SIGN-IN, this guide
.githooks/pre-commit                        secret / phone-number blocker
```

---

## 15. Research we did

| Question | Conclusion | Where |
|---|---|---|
| Which platforms actually lead to offers? | Company ATS boards first (applications reach recruiters); referrals convert best; HN threads are high-signal but small; GitHub lists are almost all US; mass portals and Telegram channels are low-value or risky | [SOURCES.md](SOURCES.md) |
| Your Gemini research (low-competition channels) | Added: YC jobs, Wellfound, VC portfolio boards, HackerEarth, Geektrust, funding-triggered outreach (on Programs); TopHire/Weekday skipped (senior roles) | Programs page |
| PM Internship Scheme | Eligible as a final-year student with a NOC unless an exclusion applies; few software roles | Programs page |
| Big product companies' boards | 130 verified on the four public APIs; plus 4 big tech read unofficially | `catalog.ts`, `catalog-unofficial.ts` |
| Countries to work in | Top 5: Germany, Ireland, Netherlands, UAE, Denmark; US/Switzerland/Canada near-closed for this profile; Kuwait easy visa but weak fit | [ABROAD.md](ABROAD.md) |
| International companies | 135 verified boards in target countries; Mistral, Wayve, Helsing, Celonis, n8n, Monzo, Supercell, PayPay, Ziina among those mentioning visa/relocation most | `catalog-international.ts` |

Parallel work: several pieces were built by Sonnet subagents in separate git worktrees (skills dictionary, master resume + resume pages, templates + fonts, AI backend, board verification, country research, upload parser), then reviewed, tested and merged.

---

## 16. Open items and next steps

1. **Add your Gemini key** to `.env.local` and restart (AI assistant, better upload parsing).
2. **Fill the master resume's TODOs:** Steady role (title, dates, what you built), AI Excel Analyst, portfolio project, LinkedIn, certificate issuer; update your Parcera title to **AI Engineer** and confirm dates.
3. **Check skills listed** that may not be yours (Kafka, WebRTC, Prisma, Expo, Kotlin).
4. **Microsoft/Netflix feeds** may show "Failing" until their rate limit clears.
5. **Not built yet:** Telegram morning digest, Gemini-based job scoring, kanban view for Applications, run-history page, password reset by email (for now the admin can remove and re-invite someone; Google sign-in avoids passwords), a page for each person to edit their own skills profile.
7. **Google sign-in:** create the OAuth client ([GOOGLE-SIGN-IN.md](GOOGLE-SIGN-IN.md)) and add the two keys.
6. **Before applying abroad:** check Osmania University on anabin (Germany), the IND recognised-sponsor list (Netherlands), and the 12-month graduate window (Ireland).
