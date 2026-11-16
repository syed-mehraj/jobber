# Jobber: design system

Blue and white on a dim, cool-grey background. Calm, dense enough for real work, and professional: closer to a modern SaaS tool than a portfolio. Open `docs/design/preview.html` in a browser to see every token and component below.

**References.** Patterns only, studied from public galleries (Dribbble, Mobbin) and rezi.ai: a slim header with a slide-out menu, white cards on a tinted canvas, a split editor, score badges, a kanban tracker. Nothing is copied: no screenshots, assets, logos or brand colours from other products are stored in this repo.

## 1. Colour

| Token | Value | Use |
|---|---|---|
| `bg` | `#EEF1F6` | the dim page background behind the white cards |
| `bg-sunken` | `#E5E9F0` | wells, the editor gutter, empty states |
| `surface` | `#FFFFFF` | cards, panels, inputs, the resume page |
| `surface-muted` | `#F7F9FC` | table headers, hovered rows, secondary panels |
| `border` | `#E2E7EF` | default hairlines |
| `border-strong` | `#CBD3DF` | input borders, dividers that must read |
| `text` | `#0F172A` | primary text |
| `text-2` | `#475569` | secondary text, labels |
| `text-3` | `#8391A7` | hints, placeholders, timestamps |
| `primary` | `#2563EB` | primary buttons, links, active nav, focus |
| `primary-hover` | `#1D4ED8` | hover |
| `primary-active` | `#1E40AF` | pressed |
| `primary-tint` | `#EAF1FF` | selected rows, active nav background, subtle buttons |
| `primary-tint-border` | `#C9DAFF` | outline of selected items |
| `focus-ring` | `rgb(37 99 235 / .35)` | 3px ring on keyboard focus |
| `success` / tint | `#15803D` / `#E8F6EE` | strong match, offer, saved |
| `warning` / tint | `#B45309` / `#FEF4E6` | partial match, expiring soon |
| `danger` / tint | `#DC2626` / `#FDECEC` | delete, rejected, failed source |

Contrast: `text` on `surface` 17:1, `text-2` 7.4:1, `text-3` 3.4:1 (hints only, never body text), white on `primary` 5.2:1.

**Match-score bands** (badges, gauges, job rows): 80–100 `success`, 60–79 `primary`, 40–59 `warning`, below 40 `danger`. The number is always shown next to the colour, so colour is never the only signal.

## 2. Type

- **UI:** Inter, with tabular numbers for scores, counts and dates.
- **Scale (px / line height):** 12/16 caption, 13/18 small, 14/20 body, 16/24 large body, 18/26 card title, 20/28 section title, 24/32 page title, 30/38 dashboard numbers.
- **Weights:** 400 body, 500 labels and buttons, 600 titles. No bold body text.
- **Resume templates** have their own fonts (see §6), separate from the app UI.

## 3. Space, shape, depth

- 4px grid. Common steps: 4, 8, 12, 16, 20, 24, 32, 40.
- Radius: 6 (badges, small controls), 8 (buttons, inputs), 12 (cards), 16 (modals, drawers).
- Shadows, used sparingly on white over the dim canvas:
  - `sm` `0 1px 2px rgb(15 23 42 / .06)`: cards
  - `md` `0 4px 14px rgb(15 23 42 / .08)`: dropdowns, hovered cards
  - `lg` `0 16px 40px rgb(15 23 42 / .14)`: modals, drawers
- Motion: 120ms for hovers, 180ms for menus, 240ms for drawers, ease-out. Respect reduced motion.

## 4. Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | solid `primary`, white text | the one main action per view: Save, Apply, Export PDF |
| Secondary | white, `border-strong` outline, `text` | everything else: Duplicate, Preview, Filter |
| Subtle | `primary-tint` fill, `primary` text | AI actions: Tailor to job, Improve bullet |
| Ghost | no fill, `text-2`, tint on hover | toolbar and row actions |
| Danger | solid `danger`, white text | only inside a confirm dialog |
| Link | `primary` text, underline on hover | inline navigation |

- **Sizes:** sm 32px (tables, toolbars), md 36px (default), lg 44px (login, empty-state call to action). Horizontal padding 12 / 14 / 18px. Icons 16px with an 8px gap.
- **Icon buttons:** square 32 or 36px, always with a tooltip and an `aria-label`.
- **States:** hover darkens one step; pressed darkens two and moves 1px down; keyboard focus adds the 3px `focus-ring`; disabled is 45% opacity with no hover; loading swaps the icon for a spinner, keeps the width and blocks clicks.
- **Groups:** a segmented control for view switches (Grid / List, Form / Split / Preview); a split button for Export (PDF ▾ DOCX).
- **Rule:** at most one primary button per view or dialog.

## 5. Components

- **Header** (64px, white, bottom hairline): logo; three links (Dashboard, Resumes, Jobs) with a blue text and underline for the current page; **New resume** (primary); a ☰ button. Below 720px the links move into the menu and New resume becomes a "+" icon.
- **Menu slider** (340px from the right, over a dimmed page): Go to (all pages with counts, including Applications), Daily search (status and Run search now), Settings (companies and sources, roles and locations, Telegram alerts), and a footer with initials and Sign out. Closes with ×, a click outside or Esc.
- **Cards:** white, 12px radius, `sm` shadow, 20px padding; the title row holds a title, a meta line and actions on the right.
- **Inputs:** 36px tall, white, `border-strong`, 8px radius; the focus border turns `primary` with the ring. The label sits above at 13/500; the hint below in `text-3`; errors in `danger` with an icon.
- **Badges:** 22px pills. Score badges use the band colours; status badges (Saved, Applied, OA, Interview, Offer, Rejected) use tints.
- **Tables:** header in `surface-muted`, 44px rows, hover row `surface-muted`, sticky header, right-aligned numbers.
- **Drawers:** a job detail drawer slides in from the right at 560px.
- **Modals:** 480px confirms, 720px forms.
- **Toasts:** bottom right, white with a coloured left edge, 4s, with an Undo when it applies.
- **Empty states:** an icon, one sentence, one primary action.
- **Score gauge:** a semicircle from 0 to 100 with the band colour, the number in the middle, and a breakdown underneath (Content, Format, Keywords, Best practices).

## 6. Resume templates

Single column and safe for applicant tracking systems: real text, no tables for layout, no text in images, standard section names. Letter and A4 sizes.

| Template | Fonts | Character |
|---|---|---|
| Simple | Inter | clean, generous spacing |
| Compact | Inter | tight spacing, fits more on one page |
| Classic | Source Serif 4 headings, Inter body | traditional, good for big tech |
| Modern | Inter, a blue hairline under headings | a touch of colour, still ATS-safe |

Controls: font size (9–11pt), line height, section spacing, margins, accent (blue or black), date format.

## 7. Screens

### Login
A centred white card on the dim canvas: logo, password field, primary "Sign in" (lg).

### Dashboard
Minimal: a greeting and one line, three numbers (new matches, applied, interviews), and today's five best matches with Apply. Full spec in [DASHBOARD.md](DASHBOARD.md); preview in `design/dashboard.html`.

### Resumes
A grid of resume cards (page thumbnail, name, version tag, last edited, best score), plus "New resume" (primary) and "Upload PDF" (secondary).

### Resume editor
```
┌ Sections ┐┌ Form ─────────────────────┐┌ Preview (A4, white page) ─────┐
│ Contact  ││ Experience                 ││ SYED MEHRAJ UR RAHMAN         │
│ Summary  ││ ┌ Parallel Labs ────────┐  ││ ─────────────────────────────  │
│ Exper. ● ││ │ Role  [ .........  ]   │  ││ EXPERIENCE                     │
│ Projects ││ │ Dates [ .. ] – [ .. ]  │  ││ Parallel Labs        2026–     │
│ Educat.  ││ │ • bullet  [Improve ✦]  │◀▶││ • bullet (click to edit here)  │
│ Skills   ││ └────────────────────────┘  ││                                │
│ + Add    ││ [+ Add role]               ││ [Score 78 ▸]   [Template ▾]    │
└──────────┘└────────────────────────────┘└────────────────────────────────┘
Toolbar: Version ▾ · Undo/Redo · Form | Split | Preview · Tailor to job ✦ · Export ▾
```
Edits on either side update the other immediately; the field being edited is outlined in `primary` on both sides.

### Jobs
Filters on the left (category, location, level, company, minimum score, posted within, sponsorship); a list on the right. Each row: company logo initial, title, company, location, posted, score badge, "Best with: Backend SDE", and Apply (primary sm) + Save (ghost). Clicking a row opens the detail drawer: why it fits, what's missing, requirements, the original posting link, and "Tailor a version" (subtle).

### Applications
A kanban: Saved → Applied → OA → Interview → Offer / Rejected. Cards show company, role, the resume version used, date and next step. Drag between columns.

### Settings
Companies (toggle, add), locations, roles and graduation year, the daily run time, Telegram connection test, sources health (last success, errors), data export.

## 8. Accessibility

Keyboard reachable everywhere, visible focus rings, labels on every input, 44px touch targets on phones, and colour never used alone (scores always show numbers, statuses always show words).
