# VFM.com — Value For Money

An AI-powered shopping comparison website. Search any product and VFM AI searches
the live web for the same item across multiple trusted sellers (Amazon, Best Buy,
Walmart, and more), then judges which listing is genuinely **worth its price** —
weighing condition, seller trust, shipping, warranty and delivery, not just the
sticker price.

## What's real in this codebase

- **Search** — calls the Anthropic API with live web search enabled (`app/api/search/route.ts`, `lib/ai.ts`). Not mock data.
- **Business and buying advice** — the same search box answers questions ("should I buy stock in bulk for my shop?", "how do I price to make a profit?"). The model routes to an advice answer and skips web search entirely, which costs about a tenth of a product search (2.4k vs 23.7k input tokens).
- **Value-for-money scoring** — the model must justify each 1–10 score with the specific tradeoff it weighed, and the listing it recommends is often *not* the cheapest one.
- **Image upload** — real product identification via Claude's vision capability.
- **Follow-up chat** — grounded in the listing data from the original search; says when something is outside that data instead of guessing.
- **Authentication** — email/password signup and login with hashed passwords (bcrypt) and signed session cookies (JWT via `jose`), plus optional **Google sign-in** (`lib/google-oauth.ts`) implemented directly against Google's OAuth 2.0 endpoints so there's only one session system.
- **Admin panel** — `/admin`, guarded by a database-backed role. Account and search stats, plus inline plan/role editing (`lib/admin.ts`).
- **Database** — Prisma schema for users, search history, saved products, and price tracking.
- **Search history** — past results are stored and **replayed from the database**, so reopening one costs nothing.
- **Rate limiting** — the paid endpoints are metered per user and per IP (`lib/rate-limit.ts`).
- **Payment plan calculator** — real amortization math, calculated live from the listing price.

## What needs YOUR setup before it works

| Feature | Requires |
|---|---|
| AI search & chat | A real `ANTHROPIC_API_KEY` in `.env` (or `VFM_MOCK_SEARCH=1` to use sample data) |
| Login/signup sessions | A real `AUTH_SECRET` in `.env` |
| Saved products / history persistence | A real Postgres `DATABASE_URL` — required locally too, no SQLite fallback |
| Live deployment | A Vercel (or similar) account |
| Google sign-in (optional) | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — the button hides itself when unset |
| Admin panel | One `npm run role:set -- you@email.com admin` to create the first admin |

See **SETUP.md** for the full step-by-step guide, including how to get each of these.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Node.js runtime)
- **Database:** Prisma ORM, PostgreSQL (dev and production — see SETUP.md 2.6 for a free hosted instance)
- **AI:** Anthropic Claude API (`claude-sonnet-5`) with the `web_search` tool
- **Auth:** bcrypt password hashing + JWT session cookies (no third-party auth provider required)

## Local development

```bash
npm install
cp .env.example .env       # then fill in DATABASE_URL, ANTHROPIC_API_KEY, and AUTH_SECRET
npm run dev
```

Visit `http://localhost:3000`.

`DATABASE_URL` needs a real Postgres connection string before this works — see
SETUP.md section 2.6 for how to get a free one. `npm run dev` applies any
pending migrations against it before starting.

### Working without an API key

Every Anthropic call costs money. To build and test the UI without spending
anything, set this in `.env`:

```
VFM_MOCK_SEARCH=1
```

Search and chat then return fixed sample data. The entire product still
works end to end — results, comparison table, save, track, history, follow-up
chat — so you can develop and demo the whole flow offline. Set it back to `0`
(and add a real key) for live search.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Apply pending migrations, then start the dev server |
| `npm run build` | Production build (fails on lint or type errors) |
| `npm test` | Run the unit tests |
| `npm run typecheck` | TypeScript check only |
| `npm run check` | typecheck + lint + tests — run this before pushing |
| `npm run db:setup` | Create/update the local database from the schema |
| `npm run prisma:studio` | Browse the database in a GUI |
| `npm run plan:set -- <email> <plan>` | Move an account onto free / pro / premium |

> Don't run `npm run build` while `npm run dev` is running — they share
> `.next/`, and the production build leaves the dev server unable to resolve its
> chunks (`Cannot find module './681.js'`). If that happens, stop the server,
> `rm -rf .next`, and start it again.

**TESTING.md** has a manual checklist covering every user-facing flow.

## Plans

Three tiers, defined in one place (`lib/plans.ts`). A plan controls which model
runs the search, how hard it works, and the monthly allowance:

| | Free | Pro | Premium |
|---|---|---|---|
| Price | $0 | $5/mo | $10/mo |
| Searches | 15/month | 300/month | 1,500/month |
| Sellers compared | 3 | 3 | **5** |
| Model | `claude-haiku-4-5` | `claude-haiku-4-5` | `claude-sonnet-5` |
| Reasoning effort | low | low | medium |
| Web searches per request | 3 | 4 | 7 |
| Response token ceiling | 3,500 | 3,500 | 6,000 |
| Follow-up chat | 20/hour | 100/hour | 300/hour |

Premium is the only tier that compares **five** sellers — the one upgrade a user
can see in the result itself. Pro buys volume and a wider sweep, not a cleverer
model, and its feature list says so rather than implying a better brain.

**`maxSearches` is the setting that actually matters for cost and speed.** Left
uncapped the model runs six or more sequential web searches, and every result
set is re-sent as input on the following turn — measured at 55k input tokens and
~48s. Capped at three, with the current prompt, it's 23.7k and ~9s. Reasoning
effort barely moves either number (225 thinking tokens in that same request), so
treat effort as a quality dial and `maxSearches` as the cost dial.

Don't set `maxSearches` below 3: the product promises three listings from three
different sellers, and a lower cap makes that quietly unsatisfiable rather than
failing loudly. A test enforces this.

**Haiku needs different request parameters.** It rejects `thinking: adaptive`
and the `output_config` block outright, and it can't use the web-search tool
without `allowed_callers: ["direct"]`. `lib/ai.ts` branches on the model name to
handle this — worth knowing before you swap models around.

**Billing is not connected.** The `plan` column on `User` is real and enforced,
but nothing collects payment — the pricing page says so rather than showing a
button that pretends to charge. Everyone starts on Free. To move an account:

```bash
npm run plan:set -- someone@example.com pro
```

The change applies on the next request; there's no need to log out. The plan is
read from the database rather than the session cookie precisely so that holds.
When Stripe is added, its webhook writes the same column and nothing else needs
to change.

Quota is counted from the `Search` table over the current UTC calendar month, so
the number shown to a user is derived from the same rows that back their history
— there's no second counter to drift.

## Rate limits

On top of the monthly quota, per-hour limits protect against bursts
(`lib/rate-limit.ts`):

| Endpoint | Anonymous | Signed in |
|---|---|---|
| `POST /api/search` | 5 / hour per IP | 30 / hour per account, plus the plan's monthly quota |
| `POST /api/chat` | not allowed — login required | per plan (20–200 / hour) |
| Auth endpoints | 10 / 15 min per IP | — |

Counters live in the memory of a single server process. On a platform that runs
several instances (Vercel included), each enforces the limit independently, so
the real ceiling is `limit × instances`. That still caps abuse without extra
infrastructure. To make the limits exact, replace the body of `hit()` with a
Redis `INCR` + `EXPIRE` on the same key — nothing else needs to change.

## Changing the AI model

The model is set in `lib/ai.ts` and can be overridden with the `VFM_MODEL`
environment variable. Two constraints before you change it:

1. It must support the **`web_search` server tool**, or product search returns nothing.
2. `lib/ai.ts` uses **adaptive thinking** (`thinking: { type: "adaptive" }`) and
   `output_config.effort`. Older models reject both.

Search also handles two responses the API can return that are easy to miss:
`pause_turn` (the web-search loop paused and must be resumed — otherwise you get
a truncated, unparseable answer) and `refusal`.

## Design

The visual language follows a supplied reference (Daylight's site) adapted to
this product. Warm paper, a single disciplined accent, editorial composition.

| Role | Token | Value |
|---|---|---|
| Page | `--paper` | `#fbf7ef` |
| Panels | `--panel` | `#f2ece0` |
| Ink | `--ink` | `#17190f` |
| Accent | `--accent` | `#1f6f43` |
| Condition flag | `--flag` | `#9a6510` |

The reference's accent is amber; ours is a deep banknote green, because this
product is about money and the accent has to read as *value*. Amber is kept as a
narrow secondary, used only to flag non-new condition and middling scores — so
when you see green, it means good value, and nothing else.

Type is three faces with distinct jobs: **Fraunces** (serif) for display and
prices, **Inter Tight** for body and UI, **JetBrains Mono** for eyebrow labels,
data and scores. All tokens live in `app/globals.css` and are mirrored into
`tailwind.config.js` — edit the CSS, not the Tailwind file.

Deliberate constraints, from the project's design standards: no emoji as UI
chrome, no gradient-filled headline words, no glassmorphism, no badge clutter,
no centred-everything layout. Motion is one orchestrated reveal
(`components/Reveal.tsx`), which is written so content is visible by default and
can never be stranded invisible if the observer doesn't fire.

## Project structure

```
app/
  page.tsx                  — main app shell (client component)
  pricing/page.tsx          — plans and pricing (server component)
  layout.tsx                — root layout + SEO metadata
  error.tsx / not-found.tsx — error and 404 boundaries
  globals.css               — design tokens, global styles
  api/
    search/route.ts         — POST: AI product search (live web search)
    chat/route.ts           — POST: AI follow-up chat (login required)
    auth/signup|login|logout|me/route.ts
    saved/route.ts          — GET/POST/DELETE: saved products
    tracked/route.ts        — GET/POST/DELETE: price tracking
    history/route.ts        — GET: search history list
    history/[id]/route.ts   — GET/DELETE: replay or remove one stored result
components/                 — all UI components (cards, chat, sidebar, etc.)
lib/
  ai.ts                     — Anthropic integration, prompts, response schema
  mock-search.ts            — sample results for VFM_MOCK_SEARCH=1
  plans.ts                  — tier definitions (model, effort, quotas, price)
  usage.ts                  — monthly quota accounting
  auth.ts                   — password hashing + JWT sessions
  http.ts / errors.ts       — shared API error shape and request validation
  rate-limit.ts             — per-user / per-IP limits
  listing-collection.ts     — shared implementation for saved + tracked
  api-client.ts             — browser fetch wrapper
  prisma.ts                 — Prisma client singleton
scripts/
  set-plan.mjs              — move an account onto a plan (no billing yet)
prisma/
  schema.prisma             — database schema
  migrations/               — committed migration history
tests/                      — unit tests (node:test)
types/
  index.ts                  — shared TypeScript types
```

## API error shape

Every route returns the same envelope on failure, and the `error` string is
always safe to show a user. Internal messages and stack traces stay in the
server log.

```json
{ "error": "Log in to ask follow-up questions.", "code": "unauthorized" }
```

## Notes on scope

This is a complete, working application — not a demo. Some items from a larger
spec (OAuth social login, SMS/OTP verification, Stripe/PayPal/Klarna live
payment processing, an admin panel) are **not included** in this build. Adding
real billing or third-party OAuth requires creating accounts with those
providers and is a meaningful follow-up project, not a config flag. The payment
plan calculator included here shows realistic installment math but does not
process real transactions.

Price *tracking* records the listing and its price at the time you saved it. It
does not yet run a background job to re-check prices and notify you — that needs
a scheduler and an email provider, which are also out of scope here.
