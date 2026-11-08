import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { summariseCalls, summaryWindowStart, CHART_DAYS, type CallRow } from "../lib/admin-stats";

const NOW = new Date("2026-11-20T15:00:00Z");
const row = (iso: string, costUsd: number, extra: Partial<CallRow> = {}): CallRow => ({
  createdAt: new Date(iso),
  costUsd,
  ok: true,
  plan: "free",
  kind: "search",
  ...extra,
});

describe("summariseCalls", () => {
  test("splits spend into today, last 7 days and this month", () => {
    const s = summariseCalls(
      [
        row("2026-11-20T09:00:00Z", 0.06), // today
        row("2026-11-15T09:00:00Z", 0.1), // this week
        row("2026-11-02T09:00:00Z", 0.2), // this month only
        row("2026-10-30T09:00:00Z", 5), // last month — in the chart, not the month
      ],
      NOW
    );
    assert.equal(s.today.calls, 1);
    assert.ok(Math.abs(s.last7Days.cost - 0.16) < 1e-9);
    assert.ok(Math.abs(s.thisMonth.cost - 0.36) < 1e-9);
    assert.equal(s.thisMonth.calls, 3);
  });

  test("puts each call on the right day of the chart, ending today", () => {
    const s = summariseCalls([row("2026-11-20T00:30:00Z", 1), row("2026-11-07T23:59:00Z", 2)], NOW);
    assert.equal(s.daily.length, CHART_DAYS);
    assert.equal(s.daily[CHART_DAYS - 1].day, "2026-11-20");
    assert.equal(s.daily[CHART_DAYS - 1].cost, 1);
    assert.equal(s.daily[0].day, "2026-11-07");
    assert.equal(s.daily[0].cost, 2);
  });

  // Failed searches are paid for and were invisible before this table existed;
  // the dashboard has to surface both their count and what they cost.
  test("counts failures and what they cost", () => {
    const s = summariseCalls(
      [row("2026-11-20T09:00:00Z", 0.05, { ok: false }), row("2026-11-20T10:00:00Z", 0.07)],
      NOW
    );
    assert.equal(s.today.failed, 1);
    assert.ok(Math.abs(s.failedCost - 0.05) < 1e-9);
  });

  test("averages only successful searches, not chats or failures", () => {
    const s = summariseCalls(
      [
        row("2026-11-20T09:00:00Z", 0.06),
        row("2026-11-20T09:01:00Z", 0.08),
        row("2026-11-20T09:02:00Z", 0.5, { ok: false }),
        row("2026-11-20T09:03:00Z", 0.001, { kind: "chat" }),
      ],
      NOW
    );
    assert.ok(Math.abs((s.avgSuccessfulSearch ?? 0) - 0.07) < 1e-9);
  });

  test("groups the month by plan, with visitors separate", () => {
    const s = summariseCalls(
      [
        row("2026-11-20T09:00:00Z", 0.06, { plan: "anonymous" }),
        row("2026-11-20T09:00:00Z", 0.06, { plan: "anonymous" }),
        row("2026-11-20T09:00:00Z", 0.2, { plan: "premium" }),
      ],
      NOW
    );
    assert.equal(s.byPlan.anonymous.calls, 2);
    assert.equal(s.byPlan.premium.calls, 1);
    assert.equal(s.byPlan.free, undefined);
  });

  test("an empty log yields zeros and no average", () => {
    const s = summariseCalls([], NOW);
    assert.equal(s.thisMonth.cost, 0);
    assert.equal(s.avgSuccessfulSearch, null);
  });
});

describe("summaryWindowStart", () => {
  test("reaches back far enough for both the chart and the month", () => {
    // Early in a month the 14-day chart starts in the previous month.
    assert.equal(summaryWindowStart(new Date("2026-11-03T12:00:00Z")).toISOString(), "2026-10-21T00:00:00.000Z");
    // Late in a month the month start is earlier than the chart.
    assert.equal(summaryWindowStart(new Date("2026-11-28T12:00:00Z")).toISOString(), "2026-11-01T00:00:00.000Z");
  });
});
