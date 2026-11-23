# Jobber for several people: accounts, sign-in and separate data

Started 23 Nov 2026. Goal: other people can use Jobber with their own accounts (Google sign-in or email and password), and each person sees only their own resumes, About you, applications and match scores.

## Decisions

| Question | Decision |
|---|---|
| Sign-in methods | **Continue with Google** (OAuth) and **email + password**. Google shows only once `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set. |
| Who can join | **Invite-only.** The admin adds an email on the Admin page and sends the invite link. Google sign-in works for an invited email; a password account needs the invite link. |
| First admin | The owner claims the admin account once on `/setup` with the current Jobber password (`APP_PASSWORD_HASH`), which proves it's the owner. Everything stored so far moves to that account. |
| Unofficial big-tech jobs | **Admin only.** Other users see only jobs from official boards. |
| AI assistant | Shares the owner's Gemini key: **30 requests a day per user**, 200 for the admin, plus a 20-per-10-minutes burst limit. |
| Library | **Better Auth** 1.7.25 (pinned), Drizzle adapter, sessions in the database. |

## Data: shared vs per person

| Shared (one copy for everyone) | Per person (has a `user_id`) |
|---|---|
| `sources`, `jobs` (listing, location, level, required skills), `runs` | `resumes`, `resume_files`, `abouts`, `applications`, `profiles` (skills to match), `job_matches` (score, matched/missing skills, dismissed), `ai_usage` |

New auth tables: `user` (with `role`: admin or user), `session`, `account`, `verification`, `rate_limit`, plus `invites`.

## Steps (each ends with the full regression run)

1. **Accounts and sign-in.** Better Auth tables and config, `/api/auth/*`, new Login page (email + password, Google), `/signup?invite=…`, `/setup` (owner claim), invites table, the proxy and every server check reading the signed-in user, sign-out.
2. **Data ownership.** `user_id` on per-person tables, the owner claim moves existing rows, every read and write filters by the signed-in user, file download checks the owner, new users start with a blank master resume with their name and email.
3. **Per-person scoring.** One scoring core used by the search and by `rescore`; `job_matches` per user; the search rescored for every user after each run, and for one user after they edit a resume or About you; Dismiss per user; unofficial jobs hidden for non-admins.
4. **Admin and limits.** Admin page (users, invites with copyable links, revoke, remove user), AI daily limit, header shows the signed-in person, docs updated, deploy to Vercel.

Regression run after every step: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and a browser run (Playwright) of the main flows with two accounts.

## Security rules

- Every server read and action gets the user from the session itself; the proxy only redirects.
- Every query on per-person data filters by `user_id`; updates and deletes use `id AND user_id`.
- The public sign-up endpoint is disabled; sign-up happens only through the invite or setup server actions, and a database hook rejects any new user that isn't invited (defence in depth).
- Invite tokens: 32 random bytes, stored only as a SHA-256 hash, single use, expire after 14 days.
- Passwords: Better Auth's scrypt hashing, at least 10 characters. Sign-in is rate-limited (stored in the database so it holds across Vercel instances).
- No secrets in the repo; Google credentials live in `.env.local` and Vercel only.
