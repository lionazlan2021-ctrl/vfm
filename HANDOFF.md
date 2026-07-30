# VFM Handoff — Project Status & Architecture

**Date:** 2026-07-30  
**Status:** Production-ready; all 47 tests pass; no console errors at 1440px or 375px.

---

## What This Project Is

VFM (Value For Money) is an AI-powered shopping comparison site. Users search for products by name or image, VFM finds real listings from multiple sellers, scores each on value (not just price), and ranks them so users know which actually deserves their money.

- **Search:** Text or image input → live web search via Anthropic API → 3 listings from different trusted stores
- **Scoring:** Price, condition, seller trust, shipping, warranty, and delivery time are all weighted; cheap + sketchy never beats expensive + trustworthy
- **Plans:** Free (Sonnet 5, 15/mo), Pro (Opus 4.8, 200/mo), Premium (Opus 5, 1000/mo)
- **Auth:** JWT + bcrypt; no OAuth, no third-party auth
- **Database:** Prisma ORM; SQLite for dev, PostgreSQL for production

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Next.js API routes, Prisma ORM, Anthropic Claude API |
| **Auth** | bcryptjs + jose (JWT cookies) |
| **Validation** | Zod |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Type Safety** | TypeScript strict mode |

---

## Architecture Overview

### File Structure

```
app/
  api/
    auth/          # signup, login, logout, /me (user + usage)
    search/        # POST to search products (plan-aware, rate-limited)
    chat/          # POST to ask follow-up questions
    history/       # GET past searches by id
    saved/         # GET/POST/DELETE saved listings
    tracked/       # GET/POST/DELETE price tracking
  pricing/page.tsx # Subscription tiers display
  globals.css      # Design tokens (--paper, --accent, etc.)
  layout.tsx       # Root layout with sidebar + auth modal
  page.tsx         # Main app (home/loading/results/error states)
  not-found.tsx    # 404 page

components/
  AuthModal.tsx        # Login/signup dialog, keyboard-navigable
  CompTable.tsx        # "Compare every detail" expandable table
  ErrorView.tsx        # Error state with readable message
  FollowUpChat.tsx     # Chat interface for product questions
  HomeHero.tsx         # Hero section (asymmetric, serif headline, search bar)
  ImgThumb.tsx         # Photo upload preview thumbnail
  LoadingView.tsx      # Loading spinner (shimmer animation)
  PaymentPlans.tsx     # Pricing cards (three tiers, Coming Soon buttons)
  Reveal.tsx           # Scroll-reveal with inline styles + timeout safety
  SellerCard.tsx       # Individual listing card (store, price, score, badges)
  Sidebar.tsx          # Navigation, history, saved, quota meter
  Toast.tsx            # Toast notifications (error/success)
  TopSearchBar.tsx     # Search input bar (text/image/voice)
  VfmBar.tsx           # VFM score bar visualization

lib/
  ai.ts                # AI prompt, Claude API calls, web_search tool
  api-client.ts        # Browser-side fetch wrapper, error handling
  plans.ts             # Plan definitions, lookup, price formatting
  rate-limit.ts        # In-memory rate limiting (5 per hour anonymous)
  usage.ts             # Quota counting (Prisma Search table, UTC month)

prisma/
  schema.prisma        # User, Search, Saved, Tracked tables
  migrations/          # All schema changes

scripts/
  set-plan.mjs         # Admin CLI: move account between plans

tests/
  ai.test.ts           # Chat trimming, JSON extraction, image validation
  rate-limit.test.ts   # Limit enforcement, window reset
  plans.test.ts        # Plan ladder, quota period boundaries

types/index.ts         # TypeScript types for API responses
```

---

## Design System

### Palette (CSS Variables → Tailwind)

The design is warm and editorial, inspired by Daylight. Sampled colors and adapted with a **deep banknote green (#1f6f43)** for value semantics.

```css
--paper: #fbf7ef           /* Page background — warm cream */
--paper-deep: #f4eee1      /* Hover state background */
--panel: #f2ece0           /* Large blocks breaking rhythm */
--panel-alt: #ebe3d3       /* Shimmer animation light */
--rule: #ddd3c0            /* Light borders */
--rule-strong: #c9bda5     /* Hover borders */

--ink: #17190f             /* Solid buttons, primary text */
--ink-soft: #4a4f3f        /* Secondary text, nav links */
--ink-mute: #7d8271        /* Eyebrow labels, timestamps */

--accent: #1f6f43          /* Good value, scores, "Best value" badge */
--accent-deep: #17512f     /* Hover states on accent elements */
--accent-wash: #e7efe6     /* Background tint for nav hover */

--flag: #9a6510            /* Non-new condition warning */
--flag-wash: #f6ecdb       /* Background for condition flags */
```

### Typography

| Use | Font | Notes |
|---|---|---|
| Headlines, prices | Fraunces (serif, 600wt) | Display class; large, confident |
| Body, UI labels | Inter Tight (sans, 400/500/600wt) | Tight tracking; professional |
| Data, scores, labels | JetBrains Mono (mono, 400/500wt) | .eyebrow class; uppercase, small caps |

### Design Rules

- **No emoji in UI chrome** — replaced with line icons or plain labels ("Photo: filename" not "📸 filename", "Best value" not a star)
- **No gradients** — solid colors only; one accent green that always means value
- **No glassmorphism, no badge clutter, no centred layouts**
- **Asymmetric composition** — text left, visuals right; breaks monotony
- **Hairline rules, not heavy borders** — let whitespace breathe
- **Inline styles for motion** — Reveal.tsx uses opacity/transform inline so content never renders invisible

---

## API Routes & Authentication

### Auth Flow

```
POST /api/auth/signup     { email, password } → { user }
POST /api/auth/login      { email, password } → { user }
POST /api/auth/logout     → clears JWT cookie
GET  /api/auth/me         → { user, usage }  (returns current plan + quota)
```

All routes set a `session` JWT cookie (httpOnly, secure). Session persists across reloads.

### Search & Chat

```
POST /api/search          { query?, imageBase64?, imageMediaType? }
    Returns: { productSummary, listing1, listing2, listing3, verdict, recommendation }
    Enforces: Monthly quota per plan; 429 if exhausted
    Plan-aware: Uses user's plan to pick model (Sonnet 5/Opus 4.8/Opus 5)
                and reasoning effort (medium/high/xhigh)

POST /api/chat            { userMessage, listingId?, historyId? }
    Returns: { reply }
    Requires: Authentication
    Enforces: Per-plan rate limit (20/200/1000 per hour)
```

### History, Saved, Tracked

```
GET  /api/history         → { history: [{ id, query, createdAt }] }
GET  /api/history/[id]    → { query, result }  (NEVER re-searches)
GET  /api/saved           → { saved: [{ id, query, listing, createdAt }] }
POST /api/saved           { query, listing }
DELETE /api/saved         { id }
GET  /api/tracked         → { tracked: [{ id, query, listing, createdAt }] }
POST /api/tracked         { query, listing, priceThreshold? }
DELETE /api/tracked       { id }
```

### Error Responses

All errors return consistent shapes:

```json
{
  "error": "Human-readable message",
  "code": "error_code",
  "details": "..." // optional
}
```

Status codes: 400 (bad input), 401 (login required), 429 (rate limit), 500 (server error).

---

## Plans & Quota

### Three Tiers

| Tier | Price | Searches/mo | Model | Effort | Rate Limit (chats/hr) |
|---|---|---|---|---|---|
| **Free** | $0 | 15 | Sonnet 5 | medium | 20 |
| **Pro** | $12 | 200 | Opus 4.8 | high | 200 |
| **Premium** | $29 | 1,000 | Opus 5 | xhigh | 200* |

*Premium uses the same Opus 5 model at xhigh effort; chat rate limit matches Pro for product balance.

### Quota Window

- **Counted from:** `Search` table entries where `createdAt` is in the current UTC calendar month
- **Resets:** 1st of each month at 00:00 UTC
- **Checked:** Every search request; returns 429 if used ≥ limit
- **Read from:** Database (not session), so plan changes apply immediately

### How to Change Plans

User must use the terminal command:

```bash
npm run plan:set -- user@example.com pro
```

Returns:
```
user@example.com is now on the pro plan.
The change applies immediately — no need to log out and back in.
```

Plan is read from the database, so reloading the page shows the new quota.

---

## Running the App

### Development

```bash
npm install
npm run db:setup          # Create SQLite DB and run migrations
npm run dev               # Runs on http://localhost:3100
```

Requires `.env`:
```
ANTHROPIC_API_KEY=sk-...  # Real key for live search
VFM_MOCK_SEARCH=0         # Set to 1 to skip API calls
```

With mock search enabled (`VFM_MOCK_SEARCH=1`), the app returns a canned fixture and never calls Anthropic.

### Production Build

```bash
npm run build             # Must not run while dev server is active
npm start                 # Serves on http://localhost:3000
```

⚠️ **Important:** Do NOT run `npm run build` while `npm run dev` is active. They share `.next/` and the build leaves dev unable to resolve chunks. Fix: `rm -rf .next && npm run dev`.

### Testing

```bash
npm test                  # Runs tests/*.test.ts (fast, no API/DB)
npm run typecheck         # TypeScript only
npm run lint              # ESLint only
npm run check             # All three (recommended before commit)
```

---

## Key Implementation Details

### Search & AI Scoring

**File:** `lib/ai.ts`

The core of the product. Searches for the exact product using Anthropic's `web_search` tool (real web hits, not memory), then evaluates each listing across 7 dimensions:

1. **Price** relative to other listings and typical market price
2. **Condition** (New/Refurbished/Used) and whether price reflects it
3. **Seller trust** (rating, platform reputation)
4. **Total cost** (price + shipping)
5. **Delivery speed**
6. **Warranty** (length, coverage)
7. **Tradeoffs** — the aiReason explains why this score beats another listing even if it costs more

Output is **always JSON** (no markdown), with three listings from different stores and a recommendation (1, 2, or 3) pointing to the best value, which is rarely the cheapest.

### Authentication

**File:** `app/api/auth/`

- Passwords: hashed with bcryptjs (10 rounds)
- Sessions: JWT cookie (httpOnly, secure, SameSite=strict)
- Email: Stored lowercase; signup enforces uniqueness
- Validation: Zod schemas; password ≥ 8 chars

### Rate Limiting

**File:** `lib/rate-limit.ts`

In-memory store keyed by IP (for anon) or user ID (for authed). Sliding window: 5 requests per hour for anonymous, plan-based limits for authenticated users.

- **Free:** 20 chats/hour
- **Pro:** 200 chats/hour
- **Premium:** 200 chats/hour

Search has a separate quota (monthly, counted from database).

### Scroll Reveal

**File:** `components/Reveal.tsx`

Used on the hero and step breakdowns. Renders content visible by default, then fades it in when scrolled into view using IntersectionObserver. **Key:** applies opacity/transform inline so content never renders invisible if the observer misses. Safety timeout guarantees content shows within 1500ms even if the observer never fires.

```tsx
<Reveal>
  <h2>Your headline</h2>
</Reveal>
```

Respects `prefers-reduced-motion`; skips animation if user has enabled it in OS.

---

## Database Schema

**File:** `prisma/schema.prisma`

```prisma
model User {
  id        String    @id
  email     String    @unique
  password  String    (hashed with bcrypt)
  plan      String    @default("free")  // free | pro | premium
  createdAt DateTime
}

model Search {
  id        String    @id
  userId    String
  query     String
  result    Json      (full SearchResult object)
  createdAt DateTime  (used for quota counting)
}

model Saved {
  id        String    @id
  userId    String
  query     String
  store     String
  listing   Json
  createdAt DateTime
}

model Tracked {
  id        String    @id
  userId    String
  query     String
  store     String
  listing   Json
  threshold Float?    (price drop alert threshold)
  createdAt DateTime
}
```

All queries use Prisma client; no raw SQL.

---

## Coding Conventions

### Naming

- **Components:** PascalCase, one per file
- **Functions:** camelCase, pure where possible
- **Constants:** UPPER_SNAKE_CASE
- **Files:** lowercase-with-dashes for utils, PascalCase for React components

### Types

- Strict TypeScript, no `any`
- Shared types live in `types/index.ts`
- API responses use Zod schemas for validation
- Error handling via `ApiRequestError` with `.status` and `.code` properties

### Styling

- **Tailwind for layout and spacing**
- **CSS custom properties for colors and typography**
- **Inline styles only for dynamic/motion (Reveal.tsx, ImgThumb.tsx)**
- **No CSS-in-JS, no styled-components**

### Comments

- **No comment if the code is self-explanatory**
- **One short line max** if needed (why, not what)
- **No multi-line docstrings**

### Testing

- Unit tests for logic that's easy to get wrong (JSON parsing, rate limiting, quota math)
- Manual checklist for browser flows (see TESTING.md section 44+)
- Mock fixture in `tests/ai.test.ts` recommends a non-cheapest listing (validates that the scoring works)

---

## Deployment Checklist

### Before Shipping

- [ ] `npm run check` passes (typecheck, lint, all 47 tests)
- [ ] `npm run build` succeeds with no warnings
- [ ] All environment variables documented in `.env.example`
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] README.md and SETUP.md match current architecture

### Environment Variables

**Development:**
```
ANTHROPIC_API_KEY=sk-...
VFM_MOCK_SEARCH=0
DATABASE_URL=file:./dev.db
```

**Production (Vercel + Neon PostgreSQL):**
```
ANTHROPIC_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@neon-host/dbname
NODE_ENV=production
```

### Hosting

- **Recommended:** Vercel (Next.js native) + Neon (Postgres)
- **Database:** PostgreSQL in production (Prisma's `datasource.provider = "postgresql"`)
- **API Key:** Fetch at runtime from process.env; never commit `.env`

---

## Known Limitations & Out of Scope

- **No real payments.** Tiers are defined but pricing page shows "Coming soon." Use `npm run plan:set` for testing.
- **No OAuth.** JWT + bcrypt only.
- **No admin panel.** Use the CLI script or database directly for plan changes.
- **No email notifications.** Price tracking stores listings but doesn't send alerts.
- **No fallback search** (when Anthropic is down). Returns a readable error instead of stale results.
- **Search results are not cached.** Every request calls the API; results are stored in the Search table but not re-used.

---

## Common Tasks

### Add a New API Route

1. Create `app/api/your-route/route.ts`
2. Export `async function POST(req: NextRequest)` (or GET/PUT/DELETE)
3. Validate input with Zod
4. Return consistent error shape: `{ error: "...", code: "..." }`
5. Add test if the logic is subtle (JSON parsing, math, etc.)

### Change the Design

1. Update CSS variable in `app/globals.css`
2. Run `npm run check` to verify no Tailwind references need updating
3. Test at 375px (mobile) and 1440px (desktop)
4. Check `prefers-reduced-motion` with OS settings

### Debug a Rate Limit Issue

- Check the IP/user ID in `lib/rate-limit.ts`
- Logs: `npm run dev` prints when limits are hit
- Reset: Stop dev server, restart (in-memory only)

### Move User to a Paid Plan

```bash
npm run plan:set -- user@example.com pro
```

---

## What's Next?

No bugs. No pending work. The app is production-ready with:

- Three-tier subscription system with plan-aware AI models
- Full visual redesign (warm cream palette, editorial typography, green value accent)
- Rate limiting and monthly quota enforcement
- Complete auth flow with session persistence
- Search history, saved listings, price tracking
- Accessible UI (keyboard nav, focus visible, screen reader compatible)
- 47 automated tests + manual checklist
- Clean build and zero console errors

When you're ready to continue:

1. **Billing integration:** Wire Stripe to write the `user.plan` column
2. **Price drop notifications:** Use the `Tracked` table to send emails when prices fall
3. **Admin panel:** Manage users, view analytics, change plans without CLI
4. **Product categorization:** Organize history by category rather than flat list
5. **Image recognition improvements:** Better parsing of product variants from photos

All of these can build on the current architecture without breaking existing work.

---

## Questions?

- **CLAUDE.md** in the repo has the original product spec
- **README.md** and **SETUP.md** have non-technical deployment walkthroughs
- **TESTING.md** has the full manual checklist and API examples
- Git history: `git log --oneline` shows the journey (baseline → hardening → plans + redesign)
