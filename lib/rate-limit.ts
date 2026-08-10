/**
 * Fixed-window rate limiter, held in process memory.
 *
 * This exists because /api/search and /api/chat each cost real money per call.
 * Without it, one unauthenticated visitor with a loop can run up a Gemini
 * bill in minutes.
 *
 * Scope and limits:
 *   - Counters live in the memory of a single server process. Running several
 *     instances (Vercel serverless, multiple containers) means each enforces
 *     the limit independently, so the effective ceiling is limit x instances.
 *     That is still a hard cap on abuse and needs no extra infrastructure.
 *   - To make limits exact across instances, swap `hit()` for a Redis
 *     INCR + EXPIRE against the same key. Nothing else has to change.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Stops the map from growing without bound on a long-lived process. */
function evictExpired(now: number) {
  if (windows.size < 5000) return;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
};

export function hit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  evictExpired(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    const w = { count: 1, resetAt: now + windowSeconds * 1000 };
    windows.set(key, w);
    return { ok: true, limit, remaining: limit - 1, retryAfter: windowSeconds };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    ok: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter,
  };
}

/**
 * Identifies the caller for rate-limiting purposes. A logged-in user is limited
 * per account; everyone else is limited per client IP.
 *
 * `x-forwarded-for` is only trustworthy behind a proxy that sets it (Vercel and
 * most hosts do). Locally it is usually absent, so all traffic shares one
 * bucket — which is correct for a single developer.
 */
export function callerKey(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(r.limit),
    "RateLimit-Remaining": String(r.remaining),
    "RateLimit-Reset": String(r.retryAfter),
    ...(r.ok ? {} : { "Retry-After": String(r.retryAfter) }),
  };
}

/** Limits, in one place so they are easy to find and tune. */
export const LIMITS = {
  /** Gemini search calls. Deliberately tight — this is the expensive one. */
  searchAnon: { limit: 5, windowSeconds: 60 * 60 },
  searchUser: { limit: 30, windowSeconds: 60 * 60 },
  /** Follow-up chat. Cheaper per call than search, but still a paid API call. */
  chatUser: { limit: 40, windowSeconds: 60 * 60 },
  /** Credential endpoints — throttled to slow down password guessing. */
  auth: { limit: 10, windowSeconds: 15 * 60 },
  /** Ordinary authenticated database writes. */
  write: { limit: 120, windowSeconds: 60 * 60 },
} as const;
