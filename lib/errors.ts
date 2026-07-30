/**
 * Error types shared by API routes and the AI layer.
 *
 * Kept separate from `lib/http.ts` so modules that only need to *throw* an
 * error don't pull in `next/server`. That keeps `lib/ai.ts` importable from
 * plain Node (the test runner), not just the Next runtime.
 */

export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "rate_limited"
  | "ai_unavailable"
  | "ai_misconfigured"
  | "internal";

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  not_found: 404,
  conflict: 409,
  payload_too_large: 413,
  rate_limited: 429,
  ai_unavailable: 503,
  ai_misconfigured: 503,
  internal: 500,
};

/**
 * An error whose `message` is safe to show the user. `handle()` in lib/http.ts
 * turns these into clean responses; anything else becomes a generic 500.
 */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}
