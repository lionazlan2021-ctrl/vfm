/**
 * Subscription plans.
 *
 * A plan controls three things: which Claude model runs the search, how much
 * reasoning effort it spends, and how many searches are included each month.
 *
 * Every search is a paid Anthropic call with live web search, so the quota is
 * the real cost control — the model and effort settings mostly change answer
 * quality. Note Opus 4.8 and Opus 5 cost the same per token, so the gap between
 * Pro and Premium is deliberately quota + effort, not just the model name.
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
    model: "claude-sonnet-5",
    searchEffort: "medium",
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
    model: "claude-opus-4-8",
    searchEffort: "high",
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
    model: "claude-opus-5",
    searchEffort: "xhigh",
    searchesPerMonth: 1000,
    chatPerHour: 200,
    features: [
      "1,000 product searches a month",
      "Our most capable model, at maximum reasoning effort",
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
