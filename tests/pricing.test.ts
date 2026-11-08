import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addUsage, costOf, emptyUsage, formatUsd, priceFor, MODEL_PRICES } from "../lib/pricing";
import { PLANS } from "../lib/plans";

describe("priceFor", () => {
  test("ignores the date suffix on a pinned model id", () => {
    assert.deepEqual(priceFor("claude-haiku-4-5-20251001"), priceFor("claude-haiku-4-5"));
  });

  // Understating spend is the worse mistake, so an unknown model must not be free.
  test("prices an unknown model above zero", () => {
    assert.ok(priceFor("claude-something-new").input > 0);
  });

  // If a plan moves to a model missing from the table, spend silently falls
  // back to a guessed price — this makes that a failing test instead.
  test("every plan's model is in the price table", () => {
    for (const plan of Object.values(PLANS)) {
      const family = plan.model.replace(/-\d{8}$/, "");
      assert.ok(family in MODEL_PRICES, `${plan.model} has no price`);
    }
  });
});

describe("addUsage / costOf", () => {
  // The exact usage of a real Free-tier search measured on 8 Nov 2026:
  // 25,637 input, 907 output, 3 web searches on Haiku 4.5 — about six cents.
  test("matches a measured Free-tier search", () => {
    const u = emptyUsage();
    addUsage(u, {
      input_tokens: 25_637,
      output_tokens: 907,
      server_tool_use: { web_search_requests: 3 },
    });
    const cost = costOf("claude-haiku-4-5-20251001", u);
    assert.ok(Math.abs(cost - 0.0602) < 0.0005, `got ${cost}`);
    assert.equal(u.apiCalls, 1);
  });

  test("accumulates across round trips (a retry costs extra)", () => {
    const u = emptyUsage();
    addUsage(u, { input_tokens: 1000, output_tokens: 100 });
    addUsage(u, { input_tokens: 500, output_tokens: 50, cache_read_input_tokens: 2000 });
    assert.equal(u.inputTokens, 1500);
    assert.equal(u.outputTokens, 150);
    assert.equal(u.cacheReadTokens, 2000);
    assert.equal(u.apiCalls, 2);
  });

  test("cache reads cost a tenth of fresh input", () => {
    const fresh = emptyUsage();
    fresh.inputTokens = 1_000_000;
    const cached = emptyUsage();
    cached.cacheReadTokens = 1_000_000;
    assert.ok(Math.abs(costOf("claude-sonnet-5", cached) - costOf("claude-sonnet-5", fresh) / 10) < 1e-9);
  });

  test("a request that never reached the API costs nothing", () => {
    assert.equal(costOf("claude-sonnet-5", emptyUsage()), 0);
  });
});

describe("formatUsd", () => {
  test("formats to cents and flags sub-cent amounts", () => {
    assert.equal(formatUsd(0), "$0.00");
    assert.equal(formatUsd(0.0602), "$0.06");
    assert.equal(formatUsd(0.001), "<$0.01");
    assert.equal(formatUsd(12.345), "$12.35");
  });
});
