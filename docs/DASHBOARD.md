# Jobber: dashboard plan

The dashboard shows the minimum: **how many new jobs match, and which ones to apply to today.** Everything else lives on its own page, reached from the header or the menu.

Preview: open [`design/dashboard.html`](design/dashboard.html) in a browser (sample data; the ☰ menu opens and closes).

## Layout

```
┌ Header ──────────────────────────────────────────────────────────────┐
│ [J] Jobber   Dashboard  Resumes  Jobs              [+ New resume] [☰]│
└──────────────────────────────────────────────────────────────────────┘
  Good morning, Syed
  6 new jobs match your resumes today.

  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ 24           │ │ 9            │ │ 2            │
  │ New matches  │ │ Applied      │ │ Interviews   │
  └──────────────┘ └──────────────┘ └──────────────┘

  ┌ Today's best matches ─────────────────────────── See all 24 → ┐
  │ [A] Graduate Software Engineer         92% match    [Apply ↗] │
  │     Atlassian · Bengaluru                                     │
  │ … up to 5 rows                                                │
  └───────────────────────────────────────────────────────────────┘
```

Content is centred, at most 1040px wide, on the dim `bg` (#EEF1F6) with white cards.

## Header: only what's needed

- **Logo:** Jobber, links to the dashboard.
- **Three links:** Dashboard, Resumes, Jobs. The current page is blue with a blue underline.
- **New resume:** the page's one primary button.
- **☰ Menu:** opens the menu slider.
- **Phones (below 720px):** the three links move into the menu, and New resume shrinks to a "+" icon.

## Menu slider: everything else

Slides in from the right (340px; 88% of the width on phones) over a dimmed page. It closes with ×, a click outside, or Esc, and focus returns to the ☰ button.

| Group | Items |
|---|---|
| Go to | Dashboard, Resumes (count), Jobs (count), Applications (count) |
| Daily search | "Running every day at 07:00", last run time, sources working, **Run search now** |
| Settings | Companies and sources, Roles and locations, Telegram alerts |
| Footer | Initials, first name, **Sign out** |

## Page fields

| Field | Shows | Data | Click |
|---|---|---|---|
| Greeting | "Good morning / afternoon / evening, Syed" (IST) | the time | none |
| Lead line | "N new jobs match your resumes today." | jobs first seen since yesterday that passed the filters | none |
| New matches | count of open, unapplied matches | `JobScore` | Jobs |
| Applied | count of applications in Applied or later | `Application` | Applications |
| Interviews | count in OA or Interview | `Application` | Applications, filtered |
| Today's best matches | the top 5 by score: role, company · location, match %, Apply ↗ | top `JobScore`, links checked live today | Apply opens the company's page and then asks "Did you apply?"; the row opens the job |

Nothing else goes on the dashboard: no charts, gauges or suggestion lists.

## States

- **No runs yet:** the lead reads "Your first job search runs tomorrow at 07:00", with a **Run search now** button. The list says "Matches will appear here".
- **Loading:** grey placeholder blocks in the shape of the numbers and rows.
- **Nothing new today:** "No new matches today." The list still shows the best open matches.

## Rules

- One primary button on screen: New resume.
- Every number links to the page that explains it.
- Match always shows as a number with a percent sign; colour (green 80+, blue 60–79) only reinforces it.
- No personal details beyond the first name and initials.

## Build steps

These slot into Phase 1.3 (header and menu) and Phase 9 (the page) of [PLAN.md](PLAN.md).

1. **Header** with active-link state and the phone layout.
2. **Menu slider:** focus trap, Esc, scrim, and return of focus to the ☰ button.
3. **Data queries** for the three numbers and the top 5, with unit tests on seeded data.
4. **Page:** greeting, numbers, list, and the Apply → "Did you apply?" flow.
5. **States:** empty, loading, nothing new.
6. **Checks:** Playwright at 1440 and 390px, an axe accessibility scan, and keyboard-only navigation of the menu.
