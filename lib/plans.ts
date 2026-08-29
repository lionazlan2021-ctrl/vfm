/**
 * Subscription plans.
 *
 * Tuned for minimum spend per search. In cost order the levers are:
 *
 *   1. maxSearches — dominant. Every web_search result set is re-sent as input
 *      on the following turn, so each extra search compounds. Measured: 6
 *      uncapped searches = 55k input tokens; 3 = 31k.
 *   2. model — Haiku is roughly a tenth of Sonnet per token, and handles this
 *      task well because the hard part (finding listings) is search, not
 *      reasoning. Free and Pro both run on it.
 *   3. maxTokens — caps the answer. Sized to the seller count, not left at a
 *      generous flat number, since thinking and output share the budget.
 *
 * Reasoning effort is deliberately NOT a headline lever: measured at 225
 * thinking tokens on a search, it is noise next to the three above.
 *
 * What a user actually gets is the seller count and the quota. Premium is the
 * only tier that compares five sellers, which is the real reason to pay for it
 * — everything else is a bigger number of the same thing.
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
  /**
   * How many different sellers to compare. The headline difference between
   * tiers — five gives a genuinely better read on what a fair price is than
   * three does, and it's the one upgrade a user can see in the result itself.
   */
  sellersCompared: number;
  /**
   * Ceiling on the model's response. Thinking and the JSON answer share it, so
   * it scales with seller count rather than sitting at a flat generous number
   * that we pay for on every request.
   */
  maxTokens: number;
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
    // Not lowered to 2: three sellers is what the product promises, and a
    // single search doesn't reliably surface three different retailers.
    maxSearches: 3,
    sellersCompared: 3,
    maxTokens: 3500,
    searchesPerMonth: 15,
    chatPerHour: 20,
    features: [
      "15 product searches a month",
      "Three sellers compared per search",
      "Full value-for-money score and verdict",
      "Follow-up questions on your results",
      "Business and buying advice, free-form",
      "Save and track listings",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 5,
    tagline: "For people who research before every purchase.",
    // Same model as Free on purpose. What Pro buys is volume and a wider
    // sweep per search, not a cleverer model — claiming otherwise would be
    // a feature list that doesn't match what the code does.
    model: "claude-haiku-4-5-20251001",
    searchEffort: "low",
    maxSearches: 4,
    sellersCompared: 3,
    maxTokens: 3500,
    searchesPerMonth: 300,
    chatPerHour: 100,
    features: [
      "300 product searches a month",
      "Wider sweep — more listings read before judging",
      "Unlimited saved listings and price tracking",
      "Full search history, replayable at no cost",
      "Everything in Free",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 10,
    tagline: "For high-value buys where being wrong is expensive.",
    model: "claude-sonnet-5",
    searchEffort: "medium",
    maxSearches: 7,
    // The one difference you can see in the result itself.
    sellersCompared: 5,
    maxTokens: 6000,
    searchesPerMonth: 1500,
    chatPerHour: 300,
    features: [
      "1,500 product searches a month",
      "FIVE sellers compared, not three",
      "Our strongest model, with more reasoning per search",
      "Best on complex or high-ticket comparisons",
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
