# VFM.com — Value For Money

An AI-powered shopping comparison website. Search any product and VFM AI searches
the live web for the same item across multiple trusted sellers (Amazon, Best Buy,
Walmart, and more), ranking results by price, trust, and overall value for money.

## What's real in this codebase

- **Search** — calls the Anthropic API with live web search enabled (`app/api/search/route.ts`, `lib/ai.ts`). Not mock data.
- **Image upload** — real image analysis via Claude's vision capability.
- **Follow-up chat** — maintains real conversation context from the original search.
- **Authentication** — real email/password signup and login with hashed passwords (bcrypt) and signed session cookies (JWT via `jose`).
- **Database** — real Prisma schema for users, search history, saved products, and price tracking.
- **Payment plan calculator** — real amortization math, calculated live from listing price.

## What needs YOUR setup before it works

| Feature | Requires |
|---|---|
| AI search & chat | A real `ANTHROPIC_API_KEY` in `.env` |
| Login/signup sessions | A real `AUTH_SECRET` in `.env` |
| Saved products / history persistence in production | A real Postgres `DATABASE_URL` (SQLite works for local dev only) |
| Live deployment | A Vercel (or similar) account |

See **SETUP.md** for the full step-by-step guide, including how to get each of these.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Node.js runtime)
- **Database:** Prisma ORM, SQLite (dev) / PostgreSQL (production)
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`) with web search tool
- **Auth:** bcrypt password hashing + JWT session cookies (no third-party auth provider required)

## Local development

```bash
npm install
cp .env.example .env       # then fill in your real ANTHROPIC_API_KEY and AUTH_SECRET
npx prisma migrate dev --name init
npm run dev
```

Visit `http://localhost:3000`.

## Project structure

```
app/
  page.tsx                 — main app shell (client component)
  layout.tsx                — root layout + SEO metadata
  globals.css                — global styles, animations
  api/
    search/route.ts          — POST: AI product search (real web search)
    chat/route.ts             — POST: AI follow-up chat
    auth/signup/route.ts        — POST: create account
    auth/login/route.ts          — POST: log in
    auth/logout/route.ts          — POST: log out
    auth/me/route.ts                — GET: current session
    saved/route.ts                   — GET/POST/DELETE: saved products
    tracked/route.ts                  — GET/POST/DELETE: price tracking
    history/route.ts                   — GET: search history
components/                — all UI components (cards, chat, sidebar, etc.)
lib/
  ai.ts                     — Anthropic API integration
  auth.ts                    — password hashing + JWT sessions
  prisma.ts                   — Prisma client singleton
prisma/
  schema.prisma              — database schema
types/
  index.ts                    — shared TypeScript types
```

## Notes on scope

This is a complete, working application — not a demo. However, some Phase items
from a larger spec (OAuth social login, SMS/OTP verification, Stripe/PayPal/Klarna
live payment processing, an admin panel) are **not included** in this build. Adding
real billing or third-party OAuth requires creating accounts with those providers
and is a meaningful follow-up project, not a config flag. The payment plan
calculator included here shows realistic installment math but does not process
real transactions.
