# VFM.com — Value For Money

An AI-powered shopping comparison website. Search any product and VFM AI searches
the live web for the same item across multiple trusted sellers (Amazon, Best Buy,
Walmart, and more), then judges which listing is genuinely **worth its price** —
weighing condition, seller trust, shipping, warranty and delivery, not just the
sticker price.

## What's real in this codebase

- **Search** — calls the Anthropic API with live web search enabled (`app/api/search/route.ts`, `lib/ai.ts`). Not mock data.
- **Value-for-money scoring** — the model must justify each 1–10 score with the specific tradeoff it weighed, and the listing it recommends is often *not* the cheapest one.
- **Image upload** — real product identification via Claude's vision capability.
- **Follow-up chat** — grounded in the listing data from the original search; says when something is outside that data instead of guessing.
- **Authentication** — email/password signup and login with hashed passwords (bcrypt) and signed session cookies (JWT via `jose`).
- **Database** — Prisma schema for users, search history, saved products, and price tracking.
- **Search history** — past results are stored and **replayed from the database**, so reopening one costs nothing.
- **Rate limiting** — the paid endpoints are metered per user and per IP (`lib/rate-limit.ts`).
- **Payment plan calculator** — real amortization math, calculated live from the listing price.

## What needs YOUR setup before it works

| Feature | Requires |
|---|---|
| AI search & chat | A real `ANTHROPIC_API_KEY` in `.env` (or `VFM_MOCK_SEARCH=1` to use sample data) |
| Login/signup sessions | A real `AUTH_SECRET` in `.env` |
| Saved products / history persistence in production | A real Postgres `DATABASE_URL` (SQLite works for local dev only) |
| Live deployment | A Vercel (or similar) account |

See **SETUP.md** for the full step-by-step guide, including how to get each of these.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Node.js runtime)
- **Database:** Prisma ORM, SQLite (dev) / PostgreSQL (production)
- **AI:** Anthropic Claude API (`claude-sonnet-5`) with the `web_search` tool
- **Auth:** bcrypt password hashing + JWT session cookies (no third-party auth provider required)

## Local development

```bash
npm install
cp .env.example .env       # then fill in ANTHROPIC_API_KEY and AUTH_SECRET
npm run dev
```

Visit `http://localhost:3000`.

`npm run dev` applies any pending database migrations before starting, so the
local SQLite database is created for you on first run — there is no separate
setup step.

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

**TESTING.md** has a manual checklist covering every user-facing flow.

## Rate limits

Search and chat cost real money per call, so both are metered (`lib/rate-limit.ts`):

| Endpoint | Anonymous | Signed in |
|---|---|---|
| `POST /api/search` | 5 / hour per IP | 30 / hour per account |
| `POST /api/chat` | not allowed — login required | 40 / hour per account |
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

## Project structure

```
app/
  page.tsx                  — main app shell (client component)
  layout.tsx                — root layout + SEO metadata
  error.tsx / not-found.tsx — error and 404 boundaries
  globals.css               — global styles, animations
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
  auth.ts                   — password hashing + JWT sessions
  http.ts / errors.ts       — shared API error shape and request validation
  rate-limit.ts             — per-user / per-IP limits
  listing-collection.ts     — shared implementation for saved + tracked
  api-client.ts             — browser fetch wrapper
  prisma.ts                 — Prisma client singleton
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
