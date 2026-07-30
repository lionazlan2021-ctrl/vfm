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

  test("prices render consistently, including zero", () => {
    assert.equal(formatPrice(PLANS.free), "$0");
    assert.equal(formatPrice(PLANS.pro), "$12");
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
