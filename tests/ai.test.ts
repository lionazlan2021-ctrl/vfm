import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractJSON, trimHistoryForApi, SearchResultSchema, isSupportedImageType } from "../lib/ai";
import { mockSearch } from "../lib/mock-search";
import { ApiError } from "../lib/errors";

describe("trimHistoryForApi", () => {
  // The bug this guards: the chat UI seeds the thread with an assistant
  // greeting. Forwarding it made the API conversation start with an assistant
  // turn, which Anthropic rejects — so every first follow-up question 400'd.
  test("drops the seeded assistant greeting so the first turn is a user turn", () => {
    const out = trimHistoryForApi([
      { role: "assistant", content: "I found pricing for X…" },
      { role: "user", content: "Which is fastest?" },
      { role: "assistant", content: "Best Buy." },
    ]);
    assert.equal(out[0].role, "user");
    assert.equal(out.length, 2);
  });

  test("leaves an already user-first history untouched", () => {
    const history = [
      { role: "user" as const, content: "a" },
      { role: "assistant" as const, content: "b" },
    ];
    assert.deepEqual(trimHistoryForApi(history), history);
  });

  test("returns empty when there is no user turn at all", () => {
    assert.deepEqual(trimHistoryForApi([{ role: "assistant", content: "only greeting" }]), []);
  });

  test("handles an empty history", () => {
    assert.deepEqual(trimHistoryForApi([]), []);
  });

  test("caps history length and still starts with a user turn", () => {
    const long = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `m${i}`,
    }));
    const out = trimHistoryForApi(long);
    assert.ok(out.length <= 8, `expected <= 8 turns, got ${out.length}`);
    assert.equal(out[0].role, "user");
  });
});

describe("extractJSON", () => {
  test("parses a bare JSON object", () => {
    assert.deepEqual(extractJSON('{"a":1}'), { a: 1 });
  });

  test("parses JSON wrapped in a markdown fence", () => {
    assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  });

  test("parses JSON surrounded by prose", () => {
    assert.deepEqual(extractJSON('Here you go:\n{"a":1}\nHope that helps!'), { a: 1 });
  });

  // The old implementation took indexOf("{") to lastIndexOf("}"), so any brace
  // in trailing prose swallowed it and JSON.parse threw.
  test("is not confused by a brace in trailing prose", () => {
    assert.deepEqual(extractJSON('{"a":1}\nNote: use {braces} carefully.'), { a: 1 });
  });

  test("handles nested objects", () => {
    assert.deepEqual(extractJSON('{"a":{"b":{"c":2}}}'), { a: { b: { c: 2 } } });
  });

  test("handles braces inside string values", () => {
    assert.deepEqual(extractJSON('{"a":"a } brace","b":2}'), { a: "a } brace", b: 2 });
  });

  test("handles escaped quotes inside string values", () => {
    assert.deepEqual(extractJSON('{"a":"say \\"hi\\" }","b":2}'), { a: 'say "hi" }', b: 2 });
  });

  test("throws a user-safe ApiError when there is no JSON", () => {
    assert.throws(() => extractJSON("I could not find anything."), (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.code, "ai_unavailable");
      // The message is shown to users, so it must not leak parser internals.
      assert.ok(!/JSON.parse|undefined|SyntaxError/.test(err.message));
      return true;
    });
  });
});

describe("SearchResultSchema", () => {
  test("accepts the mock result, so fixtures and live results share one shape", () => {
    const parsed = SearchResultSchema.safeParse(mockSearch("Sony WH-1000XM5", false));
    assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  });

  test("rejects a value score outside 1-10", () => {
    const r = SearchResultSchema.safeParse({
      listing1: { store: "A", price: "$1", valueScore: 47 },
    });
    assert.equal(r.success, false);
  });

  test("rejects a seller rating outside 0-5", () => {
    const r = SearchResultSchema.safeParse({
      listing1: { store: "A", price: "$1", sellerRating: 9 },
    });
    assert.equal(r.success, false);
  });

  test("rejects a non-URL buyUrl rather than rendering a broken link", () => {
    const r = SearchResultSchema.safeParse({
      listing1: { store: "A", price: "$1", buyUrl: "not-a-url" },
    });
    assert.equal(r.success, false);
  });

  test("allows a listing with no buyUrl (the AI is told to omit it, not invent one)", () => {
    const r = SearchResultSchema.safeParse({ listing1: { store: "A", price: "$1" } });
    assert.ok(r.success);
  });
});

describe("isSupportedImageType", () => {
  test("accepts the formats the vision API supports", () => {
    for (const t of ["image/jpeg", "image/png", "image/gif", "image/webp"]) {
      assert.ok(isSupportedImageType(t), t);
    }
  });

  test("rejects formats that would fail at the API (e.g. iPhone HEIC)", () => {
    for (const t of ["image/heic", "image/svg+xml", "application/pdf", ""]) {
      assert.equal(isSupportedImageType(t), false, t);
    }
  });
});

describe("mock search fixture", () => {
  // The product's whole premise is that best value is not always lowest price.
  // If the fixture recommended the cheapest listing, it would not exercise the
  // recommendation path in the UI at all.
  test("recommends a listing that is not the cheapest", () => {
    const r = mockSearch("Sony WH-1000XM5", false);
    const listings = [r.listing1, r.listing2, r.listing3];
    const prices = listings.map((l) => Number(l!.price.replace(/[^0-9.]/g, "")));
    const cheapestIndex = prices.indexOf(Math.min(...prices));
    assert.notEqual(r.recommendation! - 1, cheapestIndex);
  });

  test("returns three distinct stores", () => {
    const r = mockSearch("anything", false);
    const stores = [r.listing1!.store, r.listing2!.store, r.listing3!.store];
    assert.equal(new Set(stores).size, 3);
  });
});
