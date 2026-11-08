/**
 * What an AI request costs, estimated from Anthropic's published prices.
 *
 * The admin panel shows these numbers so the owner can see where the bill
 * comes from. They are estimates: Anthropic's console is the source of truth
 * for what was actually charged, and prices change — update this table when
 * they do.
 */

/** US dollars per million tokens. */
type ModelPrice = { input: number; output: number };

/**
 * Keyed by model family, without the date suffix some ids carry
 * (`claude-haiku-4-5-20251001` is priced as `claude-haiku-4-5`).
 */
export const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-5-5": { input: 4, output: 20 },
};

/**
 * Used for a model missing from the table, so an unknown model shows a
 * plausible cost rather than $0 — understating spend is the worse mistake.
 */
const FALLBACK_PRICE: ModelPrice = { input: 3, output: 15 };

/** Each web_search the model runs is billed on top of tokens. */
export const WEB_SEARCH_PRICE_USD = 0.01;

/** Cache reads bill at a tenth of the input price, cache writes at 1.25x. */
const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export function priceFor(model: string): ModelPrice {
  const family = model.replace(/-\d{8}$/, "");
  return MODEL_PRICES[family] ?? FALLBACK_PRICE;
}

/** Usage accumulated across every API round trip one request made. */
export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
  apiCalls: number;
};

export function emptyUsage(): AiUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    webSearches: 0,
    apiCalls: 0,
  };
}

/** The `usage` block of an Anthropic response, as far as cost is concerned. */
export type ResponseUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  server_tool_use?: { web_search_requests?: number | null } | null;
};

/** Adds one response's usage into the running total, in place. */
export function addUsage(total: AiUsage, usage: ResponseUsage): void {
  total.inputTokens += usage.input_tokens || 0;
  total.outputTokens += usage.output_tokens || 0;
  total.cacheReadTokens += usage.cache_read_input_tokens || 0;
  total.cacheWriteTokens += usage.cache_creation_input_tokens || 0;
  total.webSearches += usage.server_tool_use?.web_search_requests || 0;
  total.apiCalls += 1;
}

/** Estimated cost of a request in US dollars. */
export function costOf(model: string, usage: AiUsage): number {
  const p = priceFor(model);
  const perToken = (perMillion: number) => perMillion / 1_000_000;
  return (
    usage.inputTokens * perToken(p.input) +
    usage.cacheReadTokens * perToken(p.input * CACHE_READ_MULTIPLIER) +
    usage.cacheWriteTokens * perToken(p.input * CACHE_WRITE_MULTIPLIER) +
    usage.outputTokens * perToken(p.output) +
    usage.webSearches * WEB_SEARCH_PRICE_USD
  );
}

/** "$0.06", "$1.24", or "<$0.01" for amounts that would round to zero. */
export function formatUsd(amount: number): string {
  if (amount > 0 && amount < 0.005) return "<$0.01";
  return `$${amount.toFixed(2)}`;
}
