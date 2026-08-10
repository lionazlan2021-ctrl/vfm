# VFM — Value For Money

## What this is

VFM is an AI-powered shopping comparison site. A user types in a product (or uploads
a photo of one), and VFM searches the live web for that exact product across multiple
real sellers, then scores each listing on **Value For Money** — not just "which is
cheapest," but which one is actually worth its price once you weigh price, condition,
seller trust, warranty, shipping, and return terms against each other.

This repo already contains a working first build (Next.js 15 + TypeScript + Prisma +
Anthropic API). It is **not a mockup** — search, auth, saving, price tracking, and chat
are all wired to real backend logic. Your job is to take this from "working build" to
"polished, correct, production-ready product." Do not throw away the existing
architecture — audit it, fix what's broken, finish what's incomplete, and raise the
quality bar throughout. Treat every file already in this repo as a first draft you are
responsible for finishing, not a spec to re-read passively.

## Your task, concretely

Work through this repo end to end and leave it in a state where a non-technical person
can run `npm install && npm run dev` and get a fully working site with no console
errors, no broken flows, and no placeholder content. Specifically:

1. **Audit first.** Read every file in `app/`, `components/`, `lib/`, `prisma/`, and
   `types/`. Run the app locally (you'll need a real `ANTHROPIC_API_KEY` — ask the user
   for one if it's not in `.env`, or clearly stub/mock search responses behind a flag
   so you can test UI without burning API calls). Note every bug, dead prop, unhandled
   error state, and inconsistency between what a component expects and what an API
   route returns.
2. **Fix and complete the core loop**: text search → image search → results with 3
   ranked listings → comparison table → follow-up chat → save/track a listing → search
   history → signup/login/logout → session persistence. Every one of these must work,
   not just render.
3. **Harden the API routes** in `app/api/*`: input validation (zod is already a
   dependency — use it), consistent error shapes, proper HTTP status codes, rate
   limiting on the search endpoint (the Anthropic API call costs real money per
   request — an unauthenticated user should not be able to hammer it), and no leaking
   of stack traces or internal errors to the client.
4. **Improve the AI evaluation logic** in `lib/ai.ts` using the prompt spec below —
   this is the actual product, not a side detail. The scoring has to be defensible and
   consistent, not vibes.
5. **Polish the UI** in `components/`: loading states, empty states, error states,
   mobile responsiveness, accessibility (labels, focus states, keyboard nav on the
   auth modal and chat), and visual consistency with the dark/green theme already
   established in `globals.css`.
6. **Database correctness**: confirm the Prisma schema actually matches how each API
   route reads/writes it, run `npx prisma migrate dev` and fix any drift, and make sure
   `prisma/schema.prisma`'s SQLite-vs-Postgres switch (documented in SETUP.md) doesn't
   silently break anything.
7. **Write a few basic tests or at least a manual test checklist** covering signup,
   login, search (text + image), save, track, and chat — enough that a future change
   can be checked against it.
8. **Get it deploy-ready**: confirm `npm run build` succeeds cleanly, environment
   variables are all documented in `.env.example`, and the existing `SETUP.md` /
   `README.md` still match reality after your changes — update them if you change
   behavior, routes, or setup steps.

Do not ask permission to fix obviously broken things — fix them. Do ask before making
product decisions that change scope (e.g., adding OAuth, payments, or an admin panel —
README.md explicitly marks these as out of scope for now; leave them out unless asked).

## The core AI task — product search & Value For Money scoring

This is the heart of the product. The existing `SEARCH_SYSTEM` prompt in `lib/ai.ts`
is a reasonable first pass but under-specifies the actual value-for-money judgment.
Replace it with something like the prompt below (adapt as needed, but keep the
rigor — don't let it regress to "just pick the cheapest one"):

```
You are VFM AI — Value For Money — a real-time shopping intelligence engine. Your job
is not to find the cheapest listing. Your job is to find which listing is genuinely
worth its price, for this specific product, right now.

PROCESS
1. Identify the exact product from the user's query or image (brand, model, size,
   variant — be precise; if ambiguous, pick the most likely interpretation and say so
   in productSummary).
2. Use the web_search tool to find real, current listings for that exact product from
   3 DIFFERENT trusted sellers (e.g. Amazon, Best Buy, Walmart, Target, Newegg, B&H
   Photo, eBay, Noon, AliExpress). Do not invent prices, ratings, or URLs from memory —
   search first, every time.
3. For each listing, evaluate value for money using ALL of the following, not price
   alone:
   - Price relative to the other listings found AND relative to typical market price
     for this product (if a price looks unusually low, note the likely reason — used,
     refurbished, third-party seller, etc. — rather than just rewarding it).
   - Condition (new vs. refurbished vs. used) and whether the price reflects that.
   - Seller/platform trustworthiness and return policy strength.
   - Total cost including shipping, not just sticker price.
   - Delivery time, if the user's context suggests urgency.
   - Warranty length and coverage.
4. valueScore (1-10) must reflect a genuine price-to-quality-and-trust judgment. A
   cheaper but sketchy or slower listing should NOT automatically outscore a
   moderately pricier one from a trusted seller with better terms. Justify the score
   in aiReason with the specific tradeoff you weighed — not a generic compliment.
5. recommendation must point to whichever listing has the best overall value, which is
   not always listing1's price rank — it's whichever number actually deserves the
   verdict.

OUTPUT — respond with ONLY a single valid JSON object, no markdown fences, no text
before or after:
{
  "productSummary": "one-line description of the exact product identified",
  "listing1": {
    "store": "string",
    "price": "$XXX.XX",
    "originalPrice": "$XXX.XX or null",
    "condition": "New | Refurbished | Used",
    "shipping": "e.g. Free shipping / $X.XX",
    "delivery": "e.g. 2-3 business days",
    "warranty": "e.g. 1 year manufacturer",
    "sellerRating": 4.8,
    "valueScore": 9,
    "buyUrl": "https://...",
    "emoji": "single relevant emoji",
    "pros": ["specific pro", "specific pro"],
    "cons": ["specific con"],
    "aiReason": "1-2 sentences naming the actual tradeoff behind the score"
  },
  "listing2": { "...same shape, different store" },
  "listing3": { "...same shape, a third different store" },
  "verdict": "2-3 sentences: which listing to buy and the specific reason, acknowledging any real tradeoff a shopper should know about",
  "recommendation": 1
}

RULES
- All 3 listings must be different sellers/stores.
- Never fabricate a specific price, rating, or URL if search results didn't actually
  return one — say so honestly in aiReason instead of inventing precision.
- If search results are thin or the product couldn't be confidently identified, say
  so plainly rather than filling gaps with guesses.
```

Also review `askFollowUp` in `lib/ai.ts` — it should stay grounded in the actual
listing data from the original search and say when something is outside that data,
rather than freelancing.

## Tech stack (already chosen, keep it)

- Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- Prisma ORM — SQLite for local dev, PostgreSQL for production
- Anthropic Claude API with the `web_search` tool for live product search
- bcrypt + JWT (`jose`) cookie sessions for auth — no third-party auth provider

## Reference

`README.md` and `SETUP.md` in this repo already document the intended architecture,
environment variables, and a full non-technical deployment walkthrough (GitHub →
Vercel → Neon/Supabase Postgres). Read both before starting, and keep them accurate as
you make changes — they're the handoff docs a non-engineer will use to actually
publish this site.
