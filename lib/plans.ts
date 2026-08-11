/**
 * Subscription plans.
 *
 * A plan controls three things: which Claude model runs the search, how much
 * reasoning effort it spends, and how many searches are included each month.
 *
 * Every search is a paid Anthropic call with live web search, so the quota is
 * the real cost control. Free runs on Haiku to keep token usage minimal; Pro
 * and Premium both run on Sonnet 5, differentiated by effort and quota rather
 * than a different (more expensive) model.
 *
 * Billing is not wired up. `plan` is a field on the User row that an admin (or
 * a future Stripe webhook) can set; nothing here collects money.
 */

export type PlanId = "free" | "pro" | "premium";

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in USD. 0 for the free tier. */
  price: number;
  tagline: string;
  /** Claude model used for search and follow-up chat. */
  model: string;
  /** Reasoning effort for product search. Higher = better judgement, more tokens. */
  searchEffort: "low" | "medium" | "high" | "xhigh";
  /**
   * Hard cap on web_search round trips per request.
   *
   * This is the real latency and token lever, not effort. Left uncapped the
   * model runs 6+ sequential searches, and each result set is re-sent as input
   * on the next turn — measured 55k input tokens and ~48s uncapped, versus 31k
   * and ~11s at a cap of 3. Three is enough to find three sellers.
   */
  maxSearches: number;
  /** Searches included per calendar month. */
  searchesPerMonth: number;
  /** Follow-up chat messages per hour. */
  chatPerHour: number;
  /** Shown on the pricing page, in order. */
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Enough to settle a purchase you're on the fence about.",
    model: "claude-haiku-4-5-20251001",
    searchEffort: "low",
    maxSearches: 3,
    searchesPerMonth: 15,
    chatPerHour: 20,
    features: [
      "15 product searches a month",
      "Three sellers compared per search",
      "Value-for-money score and verdict",
      "Follow-up questions on your results",
      "Save and track listings",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 12,
    tagline: "For people who research before every purchase.",
    model: "claude-sonnet-5",
    searchEffort: "low",
    maxSearches: 5,
    searchesPerMonth: 200,
    chatPerHour: 60,
    features: [
      "200 product searches a month",
      "Deeper model — reads more listings before judging",
      "More thorough condition and seller-trust checks",
      "Unlimited saved listings and price tracking",
      "Full search history, replayable at no cost",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 29,
    tagline: "For high-value buys where being wrong is expensive.",
    model: "claude-sonnet-5",
    searchEffort: "medium",
    maxSearches: 8,
    searchesPerMonth: 1000,
    chatPerHour: 200,
    features: [
      "1,000 product searches a month",
      "Maximum reasoning effort on every search",
      "Best results on complex or high-ticket comparisons",
      "Priority handling when demand is high",
      "Everything in Pro",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "premium"];

export const DEFAULT_PLAN: PlanId = "free";

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

/** Reads a plan from a stored value, falling back to Free for anything unknown. */
export function getPlan(value: unknown): Plan {
  return isPlanId(value) ? PLANS[value] : PLANS[DEFAULT_PLAN];
}

/** Start of the current calendar month in UTC — the quota window. */
export function currentPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Start of the next calendar month, i.e. when the quota resets. */
export function nextPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/**
 * Price as displayed. The free tier shows "$0" rather than "Free" so it reads
 * as a comparable figure next to $12 and $29 — and so the word "Free" isn't
 * repeated directly under the plan name.
 */
export function formatPrice(plan: Plan): string {
  return `$${plan.price}`;
}
