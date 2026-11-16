# Jobber

A private workspace for tailoring resumes and finding product-company roles worth applying to.

- **Resumes:** a master resume and versions per role, edited side by side: change the form or the live preview and the other follows.
- **Jobs:** a daily search of companies' own career sites, filtered to realistic roles and scored against each resume.
- **Applications:** a tracker from saved to offer.

Status: planning. See [docs/PLAN.md](docs/PLAN.md) for the step-by-step plan and [docs/DESIGN.md](docs/DESIGN.md) for the design system; open `docs/design/preview.html` (components) and `docs/design/dashboard.html` (dashboard) in a browser to see it.

## Setup (once code lands)

```bash
git config core.hooksPath .githooks   # blocks commits containing keys, tokens or phone numbers
cp .env.example .env.local            # fill in locally; never commit real values
```
