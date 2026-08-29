/**
 * Shared UI types.
 *
 * These are declared by hand rather than inferred from the zod schemas in
 * `lib/ai.ts` on purpose: client components import this file, and importing
 * `lib/ai.ts` would pull the Anthropic SDK into the browser bundle. Keep this
 * file in step with `SearchResultSchema` when either changes.
 */

export type Listing = {
  store: string;
  price: string;
  originalPrice?: string | null;
  condition?: string;
  shipping?: string;
  delivery?: string;
  warranty?: string;
  sellerRating?: number | null;
  valueScore?: number;
  buyUrl?: string;
  emoji?: string;
  imageUrl?: string;
  pros?: string[];
  cons?: string[];
  aiReason?: string;
};

export type SearchResult = {
  /**
   * "advice" when the query was a question rather than a product — the same
   * search box answers both. Absent means listings, so results stored before
   * this existed still render.
   */
  mode?: "listings" | "advice";
  productSummary?: string;
  /** Prose answer, present only when mode is "advice". */
  advice?: string;
  listing1?: Listing;
  listing2?: Listing;
  listing3?: Listing;
  /** Premium compares five sellers; other plans leave these empty. */
  listing4?: Listing;
  listing5?: Listing;
  verdict?: string;
  /** 1-based index of the listing the AI recommends. */
  recommendation?: number;
};

/**
 * A message in the follow-up chat panel, as the UI holds it.
 * The wire format sent to `/api/chat` uses `content` instead of `text` —
 * see `ChatTurn` in `lib/ai.ts`.
 */
export type ChatMessage = { role: "user" | "assistant"; text: string };

export type PlanId = "free" | "pro" | "premium";

export type User = {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  /** Profile picture from Google, when the account signed in that way. */
  image?: string | null;
  /** Drives the admin link in the sidebar. The server checks this again on
   *  every /admin request — this flag only controls what is shown. */
  isAdmin?: boolean;
};

/** This month's search allowance, returned alongside the session. */
export type Usage = {
  used: number;
  limit: number;
  remaining: number;
  /** ISO timestamp of the next reset. */
  resetsAt: string;
  planName: string;
};

/** A past search, as returned by `GET /api/history`. */
export type HistoryEntry = {
  id: string;
  query: string;
  createdAt: string;
};

/** A saved or tracked listing, as returned by `GET /api/saved` and `/api/tracked`. */
export type SavedEntry = {
  id: string;
  query: string;
  store: string;
  price: string;
  listing: Listing;
  createdAt: string;
};

/** The failure envelope every API route uses. */
export type ApiErrorBody = {
  error: string;
  code?: string;
  details?: string[];
};
