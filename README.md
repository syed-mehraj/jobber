# Jobber

A private workspace for tailoring resumes and finding product-company roles worth applying to.

- **Resumes:** a master resume and versions per role, edited side by side: change the form or the live preview and the other follows.
- **Jobs:** a daily search of companies' own career sites, filtered to realistic roles and scored against each resume.
- **Applications:** a tracker from saved to offer.

Status: Phase 1 done (design system, header, menu slider, dashboard with sample data). See [docs/PLAN.md](docs/PLAN.md) for the step-by-step plan and [docs/DESIGN.md](docs/DESIGN.md) for the design system; open `docs/design/preview.html` (components) and `docs/design/dashboard.html` (dashboard) in a browser to see it.

## Setup

```bash
git config core.hooksPath .githooks   # blocks commits containing keys, tokens or phone numbers
cp .env.example .env.local            # fill in locally; never commit real values
npm install
npm run dev                           # http://localhost:3000
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Code map

- `src/app/globals.css`: the design tokens (Tailwind `@theme`).
- `src/components/ui/`: Button, Card, Badge, ScoreBadge, Input, EmptyState, Skeleton, icons.
- `src/components/shell/`: the header and the menu slider.
- `src/app/(app)/`: the pages. `/styleguide` shows every token and component.
- `src/lib/sample-data.ts`: sample numbers until the database and the daily search exist.
