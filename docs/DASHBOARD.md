# Jobber: dashboard plan

The dashboard answers three questions in one screen: **what's new, how well do I fit, and what should I do next.** Nothing else goes on it; detail lives on the Jobs, Resumes and Applications pages.

Preview: open [`design/dashboard.html`](design/dashboard.html) in a browser (sample data; the filters and Week / Month switch work).

## References

Patterns studied from four Dribbble shots the user picked. Only the patterns are used; no images, assets or brand styles are stored in this repo.

| Reference | Pattern taken |
|---|---|
| Fintech cash-flow dashboard | The app as a rounded frame on a dim canvas; a greeting header; an "AI insight" list of suggested actions with tinted icons |
| AI feedback aggregator | A clean data table: soft header row, small chips for categories, light row dividers |
| Real estate dashboard | One stat strip with dividers and coloured delta pills; a bar chart with grey bars and one highlighted bar |
| AI content dashboard | A primary "New …" button at the top of the sidebar; filter pills with counts; a gauge drawn with tick marks |

## Layout

```
┌ dim canvas ─────────────────────────────────────────────────────────────┐
│ ┌ Sidebar ─┐ ┌ Top bar: search ⌘K · last run · alerts · avatar ───────┐ │
│ │ Jobber   │ ├────────────────────────────────────────────────────────┤ │
│ │[+ New    │ │ Good morning, Syed               [Run search now]      │ │
│ │  resume] │ │ 6 new matches since yesterday …                        │ │
│ │ Dashboard│ ├────────────────────────────────────────────────────────┤ │
│ │ Resumes 4│ │ New matches │ Applied this week │ Interviews │ Avg match│ │
│ │ Jobs   24│ ├──────────────────────────────────┬─────────────────────┤ │
│ │ Applic. 9│ │ New matches (bars, Week|Month)   │ Average match gauge │ │
│ │ Settings │ ├──────────────────────────────────┼─────────────────────┤ │
│ │          │ │ Top matches (pills + table)      │ Next steps          │ │
│ │[Daily    │ └──────────────────────────────────┴─────────────────────┘ │
│ │ search]  │                                                            │
│ └──────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Frame:** `canvas` #E4E8EF outside; the frame is #F3F5F9 with a 22px radius; white cards with a 16px radius; 12px gaps.
- **Widths:** sidebar 232px; content rows split about 62 / 38.
- **Below 1100px:** the two-column rows stack.
- **Below 860px:** the sidebar becomes a drawer (menu button in the top bar), and the stat strip becomes 2 × 2.

## Blocks

| # | Block | Shows | Data | Action |
|---|---|---|---|---|
| 1 | Sidebar | Logo; **New resume** (the page's one primary button); Dashboard, Resumes, Jobs, Applications with counts; Settings; a **Daily search** card (next run time, sources healthy) | `Resume` count; unseen `Job` count; open `Application` count; latest `Run` and `Source` health | Navigate; the card opens Settings › Sources |
| 2 | Top bar | Search (⌘K), "Last run today, 07:02", a bell with a dot when there are unseen matches, avatar initials | Latest `Run.finishedAt`; unseen matches | ⌘K opens the command menu; the bell opens the latest digest |
| 3 | Greeting | "Good morning / afternoon / evening, Syed" and one sentence: new matches since yesterday, and how many are strong fits for which resume | Jobs first seen since yesterday; their best version and score | **Run search now** (secondary) runs the pipeline on demand, at most once every 30 minutes |
| 4 | Stat strip | New matches · Applied this week · Interviews · Average match, each with a delta pill (green up, red down, grey flat) | `JobScore`, `Application` status changes, compared with the previous period | Each cell links to its page, filtered |
| 5 | New matches chart | Bars for the last 7 days (or 4 weeks); past bars grey, today blue; hover shows "N new" | New jobs per day or week | Week / Month switch; clicking a bar opens Jobs for that day |
| 6 | Average match gauge | Mean score of current matches (tick gauge), the best resume version, counts in the three fit bands | `JobScore` of open, unapplied jobs | Clicking a band opens Jobs filtered to it |
| 7 | Top matches | Filter pills with counts (All, Internships, New grad, ML / AI); up to 6 rows: role, company · location · age, match score, resume to use, **Apply ↗** | Top-scoring open jobs, links checked live today | Apply opens the company's page and asks "Did you apply?" (Yes moves it to Applications › Applied); the row opens the job drawer |
| 8 | Next steps | Up to 4 suggestions, each with an icon, a title and one detail line | Rules, not AI: a strong match with missing keywords → tailor; applied more than 7 days ago with no update → follow up; bullets without numbers → improve; an interview in the next 3 days → prepare | Opens the right place: the editor at that version, the application, or the bullet |

## States

- **First visit (no runs yet):** the greeting reads "Set up your daily search"; the chart and gauge show empty states with one action, **Run first search**; the table is replaced by "Matches appear here after the first run".
- **Loading:** skeletons in each card's shape; the numbers never jump.
- **A run in progress:** the sidebar card shows "Searching… 18 of 40 sources" with the meter moving; **Run search now** is disabled with a spinner.
- **Sources failing:** the sidebar card turns amber: "36 of 40 sources healthy · View".
- **Nothing new today:** "No new matches since yesterday"; the chart still shows the week.

## Rules

- One primary button on the page: **New resume**. Everything else is secondary, ghost or a link.
- Every number is real and clickable; no decorative charts.
- Scores always show the number next to the colour.
- Times in IST.
- No personal details beyond the first name and initials appear on the dashboard.

## Build steps

These slot into Phase 9 of [PLAN.md](PLAN.md). The shell (1, 2) is built in Phase 1.3.

1. **Data queries:** one server function per block, each with a unit test against seeded data.
2. **Shell:** the frame, sidebar (with counts and the daily-search card), top bar and phone drawer.
3. **Greeting and stat strip:** deltas computed against the previous period.
4. **Chart:** a small hand-built bar chart (no chart library), animated in, with Week / Month and keyboard-reachable bars.
5. **Gauge:** an SVG tick gauge with the three bands.
6. **Top matches:** pills, table and Apply flow with the "Did you apply?" confirmation.
7. **Next steps:** the four rules, each with a test.
8. **States:** empty, loading, running, failing.
9. **Checks:** Playwright at 1440, 1024 and 390px; axe accessibility scan; Lighthouse 90+.
