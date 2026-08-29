import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  PLANS,
  PLAN_ORDER,
  DEFAULT_PLAN,
  getPlan,
  isPlanId,
  formatPrice,
  currentPeriodStart,
  nextPeriodStart,
} from "../lib/plans";

describe("plan lookup", () => {
  test("resolves each known plan id", () => {
    for (const id of PLAN_ORDER) {
      assert.equal(getPlan(id).id, id);
    }
  });

  // A plan is read from a free-text database column, so anything could be in
  // there — an old tier name, a typo, null. It must degrade to Free rather
  // than throw or, worse, grant a bigger quota.
  test("falls back to the default plan for unknown values", () => {
    for (const bogus of ["enterprise", "", null, undefined, 42, {}]) {
      assert.equal(getPlan(bogus).id, DEFAULT_PLAN, `input: ${JSON.stringify(bogus)}`);
    }
  });

  test("isPlanId only accepts real ids", () => {
    assert.equal(isPlanId("pro"), true);
    assert.equal(isPlanId("enterprise"), false);
    assert.equal(isPlanId(null), false);
  });
});

describe("plan ladder", () => {
  test("quotas increase with price", () => {
    const ordered = PLAN_ORDER.map((id) => PLANS[id]);
    for (let i = 1; i < ordered.length; i++) {
      assert.ok(
        ordered[i].price > ordered[i - 1].price,
        `${ordered[i].id} must cost more than ${ordered[i - 1].id}`
      );
      assert.ok(
        ordered[i].searchesPerMonth > ordered[i - 1].searchesPerMonth,
        `${ordered[i].id} must include more searches than ${ordered[i - 1].id}`
      );
      assert.ok(
        ordered[i].chatPerHour >= ordered[i - 1].chatPerHour,
        `${ordered[i].id} must not allow fewer chats than ${ordered[i - 1].id}`
      );
    }
  });

  test("reasoning effort never decreases as you pay more", () => {
    const rank = { low: 0, medium: 1, high: 2, xhigh: 3 };
    const ordered = PLAN_ORDER.map((id) => PLANS[id]);
    for (let i = 1; i < ordered.length; i++) {
      assert.ok(rank[ordered[i].searchEffort] >= rank[ordered[i - 1].searchEffort]);
    }
  });

  test("the search cap never decreases as you pay more", () => {
    const ordered = PLAN_ORDER.map((id) => PLANS[id]);
    for (let i = 1; i < ordered.length; i++) {
      assert.ok(
        ordered[i].maxSearches >= ordered[i - 1].maxSearches,
        `${ordered[i].id} must not search less than ${ordered[i - 1].id}`
      );
    }
  });

  test("the seller count never decreases as you pay more", () => {
    const ordered = PLAN_ORDER.map((id) => PLANS[id]);
    for (let i = 1; i < ordered.length; i++) {
      assert.ok(
        ordered[i].sellersCompared >= ordered[i - 1].sellersCompared,
        `${ordered[i].id} must not compare fewer sellers than ${ordered[i - 1].id}`
      );
    }
  });

  // The product promises three different sellers minimum. A search cap below
  // the seller count makes that unsatisfiable — and it fails quietly, returning
  // fewer listings rather than erroring, so nothing else would catch it.
  test("every plan can search at least as many times as it promises sellers", () => {
    for (const id of PLAN_ORDER) {
      const p = PLANS[id];
      assert.ok(p.sellersCompared >= 3, `${id} promises only ${p.sellersCompared} sellers`);
      assert.ok(
        p.maxSearches >= p.sellersCompared - 1,
        `${id} caps searches at ${p.maxSearches} but promises ${p.sellersCompared} sellers`
      );
    }
  });

  // Thinking and the JSON share max_tokens. Five fully-populated listings do not
  // fit in the budget sized for three, and the failure mode is a response that
  // truncates mid-object and fails JSON parsing.
  test("the token ceiling leaves room for the sellers each plan promises", () => {
    for (const id of PLAN_ORDER) {
      const p = PLANS[id];
      assert.ok(
        p.maxTokens >= p.sellersCompared * 700,
        `${id} allows ${p.maxTokens} tokens for ${p.sellersCompared} listings — too tight`
      );
    }
  });

  test("the free tier really is free", () => {
    assert.equal(PLANS.free.price, 0);
  });

  test("every plan names a model and has features to show", () => {
    for (const id of PLAN_ORDER) {
      const p = PLANS[id];
      assert.ok(p.model.length > 0, `${id} needs a model`);
      assert.ok(p.features.length > 0, `${id} needs features`);
      assert.ok(p.tagline.length > 0, `${id} needs a tagline`);
    }
  });

  // Pinned to the formatting, not to specific prices, so repricing a tier
  // doesn't fail a test that isn't about pricing. Zero is the case worth
  // pinning: it must render as "$0", not "" or "Free".
  test("prices render consistently, including zero", () => {
    assert.equal(formatPrice(PLANS.free), "$0");
    for (const id of PLAN_ORDER) {
      assert.match(formatPrice(PLANS[id]), /^\$\d+$/, `${id} price must render as $N`);
    }
  });
});

describe("quota period", () => {
  test("the window starts at midnight UTC on the 1st", () => {
    const start = currentPeriodStart(new Date("2026-07-30T11:22:33Z"));
    assert.equal(start.toISOString(), "2026-07-01T00:00:00.000Z");
  });

  test("the next window is the 1st of the following month", () => {
    const next = nextPeriodStart(new Date("2026-07-30T11:22:33Z"));
    assert.equal(next.toISOString(), "2026-08-01T00:00:00.000Z");
  });

  test("rolls over the year correctly in December", () => {
    const next = nextPeriodStart(new Date("2026-12-14T09:00:00Z"));
    assert.equal(next.toISOString(), "2027-01-01T00:00:00.000Z");
  });

  test("the reset is always after the window start", () => {
    for (const iso of ["2026-01-31T23:59:59Z", "2026-02-01T00:00:00Z", "2024-02-29T12:00:00Z"]) {
      const d = new Date(iso);
      assert.ok(nextPeriodStart(d).getTime() > currentPeriodStart(d).getTime(), iso);
    }
  });
});
