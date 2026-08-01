# Paper publication site

Public research papers for freshman.academy. Abstracts are public and indexable;
the full PDF requires a (free) account. Anyone signed in may submit a paper, and
an editor reviews every submission before it appears.

## How access works

Three tiers, and only the middle one is open to the world:

| Who | Can do |
|---|---|
| Anyone, signed out | Read the paper index and any published abstract |
| Any signed-in user (`READER`) | Download published PDFs, submit their own papers |
| `ADMIN` | Publish or return submissions |

Signup is deliberately open — it is the point, since the gated PDF is what makes
an account worth creating. **Publishing is not gated by who can register**, it is
gated by review: a submission stays invisible until an admin publishes it. That is
why there is no author allowlist, and why open signup is not a spam risk.

Roles come from `ADMIN_EMAILS` and are recomputed on every sign-in. There is no
in-app UI to change them.

### Where the checks actually live

`src/proxy.ts` redirects signed-out users away from `/submit`, `/submissions` and
`/admin`, but that is an **optimistic cookie check and not a security boundary** —
it never runs for a direct server action POST. The real checks are in
`src/lib/dal.ts`, next to the data:

- `requireUser()` — redirects to `/login`
- `requireAdmin()` — re-reads the role from the **database**, not the JWT, so an
  admin removed from `ADMIN_EMAILS` loses access immediately rather than when
  their token expires
- `getOptionalUser()` — for pages that must stay public and crawlable

Uploaded PDFs are stored **outside `public/`** with generated filenames and are
served only by `src/app/api/papers/[id]/file/route.ts`. Anything under `public/`
would be served statically with no auth check, which would bypass the gate
entirely.

## SEO

The PDF is gated, so **the abstract is the only thing search engines can read** —
it carries the site's entire search presence. Two consequences:

- Abstracts should be complete summaries, not teasers. The submit form says so.
- Abstract pages carry flexible-sampling JSON-LD (`isAccessibleForFree: false`
  plus `hasPart`), which is the supported way to declare metered content. Serving
  crawlers the full text while showing readers a wall is cloaking and is
  penalised — do not "optimise" the gate by making an exception for bots.

## Local development

```bash
cp .env.example .env      # then fill in AUTH_SECRET and the Google client
npm install               # postinstall runs prisma generate
npm run db:migrate        # creates prisma/dev.db
npm run db:seed           # optional: demo papers in every review state
npm run dev
```

Google sign-in needs `http://localhost:3000/api/auth/callback/google` registered
as an authorized redirect URI. Until `AUTH_GOOGLE_ID` is set the login page says
so instead of showing a broken button.

Without `RESEND_API_KEY`, decision emails are logged to the console rather than
sent, so the review flow is testable end to end with no mail account.

### Demo data

`npm run db:seed` fills the database with ten papers spanning all four states
(published, under review, needs revision, draft) and writes a real one-page PDF
for each, so every download link resolves to a file a viewer can actually open.
It is **destructive** — it drops all papers, notifications and email logs, then
reinserts — but it preserves user accounts, so an open dev session survives.

Both dev-login accounts are wired to have something to look at: the editor lands
on a review queue with two pending papers and unread notifications, and the
reader owns one paper in each of the four states, including a returned one that
shows the editor's revision note.

Everything it inserts carries a `demo-` id prefix, and it **refuses to run** if
it finds any paper without one — those arrived through `/submit` and are real,
and their PDFs could not be matched back up once the rows were gone. Override
with `SEED_FORCE=1` only when wiping a throwaway environment on purpose.

It can also seed the deployed site: open the Render Shell and run
`npm run db:seed`. It reads `DATABASE_URL` and `UPLOAD_DIR`, so the rows and the
PDFs both land on the mounted disk.

| Script | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Load demo papers and generate their PDFs |
| `npm run db:studio` | Browse the database |
| `npm run lint` | ESLint |

## Environment

Full explanations live in `.env.example` — it is the documentation, and this table
is a summary. The four that cause damage rather than an obvious failure:

| Var | Why it is load-bearing |
|---|---|
| `DATABASE_URL` | On Render must sit at the **root** of the disk mount (`file:/var/data/car.db`). sqlite will not create parent directories, and a path outside the mount is wiped on deploy — silent data loss. |
| `UPLOAD_DIR` | Must be inside the disk mount, and outside `public/`. Wrong value discards every uploaded paper on the next deploy. |
| `AUTH_SECRET` | Without a stable value every restart signs all users out. |
| `ADMIN_EMAILS` | Blank means nobody can publish; papers pile up in the queue. |

Others: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_SITE_URL`,
`RESEND_API_KEY`, `MAIL_FROM`.

## Deployment

`render.yaml` is a Blueprint for a single Render web service with a 1 GB disk. It
documents its own reasoning; the parts worth knowing before you touch it:

- **SQLite on a disk is a deliberate deviation** from `Weak/`, which uses
  Postgres. The cost is that a disk disables zero-downtime deploys and caps the
  service at **one instance, permanently** — two instances would be two writers
  against one SQLite file. If that becomes a problem the fix is Postgres plus
  object storage, not more instances.
- Migrations run in `startCommand`, not `buildCommand`, because the disk is not
  mounted during the build.
- Size the disk for **PDF growth**, not rows: 1 GB is about 100 papers at the
  10 MB cap. Disks can grow but never shrink.
- Preview environments are off: Google OAuth only accepts pre-registered redirect
  URIs, so sign-in cannot work on a preview hostname.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript `strict` · Tailwind v4 ·
Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`) · Auth.js v5 (Google) ·
Resend.

Conventions follow `ONBOARDING.md` §3–§4: `src/` layout, `auth.ts`/`auth.config.ts`
split, route-local `actions.ts` and `_components/`, shared navy/orange tokens with
review status on the separate state triad.
