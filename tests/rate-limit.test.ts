import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hit, callerKey, rateLimitHeaders, LIMITS } from "../lib/rate-limit";

/** Unique per test so cases don't share a counter. */
let n = 0;
const freshKey = () => `test-key-${process.pid}-${n++}`;

describe("rate limiter", () => {
  test("allows exactly `limit` requests, then blocks", () => {
    const key = freshKey();
    for (let i = 1; i <= 3; i++) {
      assert.equal(hit(key, 3, 60).ok, true, `request ${i} should be allowed`);
    }
    assert.equal(hit(key, 3, 60).ok, false, "the 4th request should be blocked");
  });

  test("counts down remaining and never reports a negative", () => {
    const key = freshKey();
    assert.equal(hit(key, 2, 60).remaining, 1);
    assert.equal(hit(key, 2, 60).remaining, 0);
    assert.equal(hit(key, 2, 60).remaining, 0);
  });

  test("keeps separate counters per key, so one caller can't block another", () => {
    const a = freshKey();
    const b = freshKey();
    hit(a, 1, 60);
    assert.equal(hit(a, 1, 60).ok, false);
    assert.equal(hit(b, 1, 60).ok, true, "a different caller must be unaffected");
  });

  test("resets once the window has elapsed", async () => {
    const key = freshKey();
    // A 1-second window keeps the test fast.
    assert.equal(hit(key, 1, 1).ok, true);
    assert.equal(hit(key, 1, 1).ok, false);
    await new Promise((r) => setTimeout(r, 1100));
    assert.equal(hit(key, 1, 1).ok, true, "the window should have reset");
  });

  test("reports a positive retryAfter when blocked", () => {
    const key = freshKey();
    hit(key, 1, 60);
    const blocked = hit(key, 1, 60);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 60);
  });
});

describe("callerKey", () => {
  const req = (headers: Record<string, string>) => new Request("http://x/", { headers });

  test("prefers the user id, so a signed-in user is metered per account not per IP", () => {
    assert.equal(callerKey(req({ "x-forwarded-for": "1.2.3.4" }), "user_1"), "user:user_1");
  });

  test("falls back to the first x-forwarded-for entry", () => {
    assert.equal(callerKey(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), "ip:1.2.3.4");
  });

  test("falls back to x-real-ip when there is no forwarded header", () => {
    assert.equal(callerKey(req({ "x-real-ip": "9.9.9.9" })), "ip:9.9.9.9");
  });

  test("still returns a usable key with no headers at all", () => {
    assert.equal(callerKey(req({})), "ip:unknown");
  });
});

describe("rateLimitHeaders", () => {
  test("omits Retry-After while the caller is still under the limit", () => {
    const h = rateLimitHeaders({ ok: true, limit: 5, remaining: 4, retryAfter: 60 });
    assert.equal(h["RateLimit-Limit"], "5");
    assert.equal(h["Retry-After"], undefined);
  });

  test("includes Retry-After once blocked", () => {
    const h = rateLimitHeaders({ ok: false, limit: 5, remaining: 0, retryAfter: 42 });
    assert.equal(h["Retry-After"], "42");
  });
});

describe("configured limits", () => {
  // Anonymous callers must be capped harder than signed-in ones: every search
  // is a paid Anthropic call and anonymous traffic is unattributable.
  test("anonymous search allowance is stricter than the signed-in allowance", () => {
    assert.ok(LIMITS.searchAnon.limit < LIMITS.searchUser.limit);
  });

  test("every limit is a positive number", () => {
    for (const [name, cfg] of Object.entries(LIMITS)) {
      assert.ok(cfg.limit > 0, `${name}.limit must be positive`);
      assert.ok(cfg.windowSeconds > 0, `${name}.windowSeconds must be positive`);
    }
  });
});
