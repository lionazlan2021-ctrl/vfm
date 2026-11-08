import { prisma } from "./prisma";
import { currentPeriodStart } from "./plans";

/**
 * AI spend figures for the admin panel, built from the AiCall log.
 *
 * Aggregated in code from one query rather than many SQL group-bys: the
 * dashboard needs the same rows sliced several ways (today, week, month, per
 * day, per plan), the volume is small, and keeping the arithmetic in a pure
 * function (`summariseCalls`) is what makes it testable.
 */

export type CallRow = {
  createdAt: Date;
  costUsd: number;
  ok: boolean;
  plan: string;
  kind: string;
};

export type Bucket = { cost: number; calls: number; failed: number };

export type DayBucket = Bucket & { day: string };

export type SpendSummary = {
  today: Bucket;
  last7Days: Bucket;
  thisMonth: Bucket;
  /** Oldest first, one entry per UTC day, ending today. */
  daily: DayBucket[];
  /** This month, by who made the request. */
  byPlan: Record<string, Bucket>;
  /** This month: average cost of a search that returned a result. */
  avgSuccessfulSearch: number | null;
  /** This month: money spent on requests that ended in an error. */
  failedCost: number;
};

export const CHART_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function emptyBucket(): Bucket {
  return { cost: 0, calls: 0, failed: 0 };
}

function add(bucket: Bucket, row: CallRow) {
  bucket.cost += row.costUsd;
  bucket.calls += 1;
  if (!row.ok) bucket.failed += 1;
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** The earliest timestamp `summariseCalls` needs rows from. */
export function summaryWindowStart(now = new Date()): Date {
  const chartStart = new Date(startOfUtcDay(now).getTime() - (CHART_DAYS - 1) * DAY_MS);
  const monthStart = currentPeriodStart(now);
  return chartStart < monthStart ? chartStart : monthStart;
}

export function summariseCalls(rows: CallRow[], now = new Date()): SpendSummary {
  const todayStart = startOfUtcDay(now);
  const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
  const monthStart = currentPeriodStart(now);
  const chartStart = new Date(todayStart.getTime() - (CHART_DAYS - 1) * DAY_MS);

  const today = emptyBucket();
  const last7Days = emptyBucket();
  const thisMonth = emptyBucket();
  const byPlan: Record<string, Bucket> = {};
  const daily: DayBucket[] = Array.from({ length: CHART_DAYS }, (_, i) => ({
    day: new Date(chartStart.getTime() + i * DAY_MS).toISOString().slice(0, 10),
    ...emptyBucket(),
  }));

  let successfulSearches = 0;
  let successfulSearchCost = 0;
  let failedCost = 0;

  for (const row of rows) {
    const t = row.createdAt.getTime();
    if (t >= todayStart.getTime()) add(today, row);
    if (t >= weekStart.getTime()) add(last7Days, row);
    if (t >= chartStart.getTime()) {
      const index = Math.floor((t - chartStart.getTime()) / DAY_MS);
      if (index >= 0 && index < CHART_DAYS) add(daily[index], row);
    }
    if (t >= monthStart.getTime()) {
      add(thisMonth, row);
      add((byPlan[row.plan] ??= emptyBucket()), row);
      if (!row.ok) failedCost += row.costUsd;
      if (row.ok && row.kind === "search") {
        successfulSearches += 1;
        successfulSearchCost += row.costUsd;
      }
    }
  }

  return {
    today,
    last7Days,
    thisMonth,
    daily,
    byPlan,
    avgSuccessfulSearch: successfulSearches ? successfulSearchCost / successfulSearches : null,
    failedCost,
  };
}

export type RecentCall = {
  id: string;
  createdAt: Date;
  kind: string;
  plan: string;
  query: string | null;
  costUsd: number;
  ok: boolean;
  errorDetail: string | null;
  email: string | null;
};

export type AiActivity = {
  summary: SpendSummary;
  recent: RecentCall[];
  /** When logging began, i.e. the oldest row. Null if nothing logged yet. */
  trackingSince: Date | null;
  /** The most recent failure, if it came after the most recent success. */
  ongoingFailure: { at: Date; detail: string } | null;
};

/**
 * Everything the dashboard shows about AI usage. Returns null if the AiCall
 * table doesn't exist yet (the migration hasn't been applied), so the page can
 * say so instead of crashing.
 */
export async function getAiActivity(now = new Date()): Promise<AiActivity | null> {
  // Sequential, not Promise.all: production runs with connection_limit=1, so
  // parallel queries only queue for the one connection — and a long enough
  // queue trips Prisma's pool timeout and fails the whole page.
  try {
    const rows = await prisma.aiCall.findMany({
      where: { createdAt: { gte: summaryWindowStart(now) } },
      select: { createdAt: true, costUsd: true, ok: true, plan: true, kind: true },
      // A ceiling, not an expectation: keeps one bad month from loading
      // unbounded rows into memory.
      take: 50_000,
    });

    const recentRows = await prisma.aiCall.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        createdAt: true,
        kind: true,
        plan: true,
        query: true,
        costUsd: true,
        ok: true,
        errorDetail: true,
        user: { select: { email: true } },
      },
    });

    // Three lookups in one round trip: when logging began, the last success,
    // and the last AI-side failure.
    const [meta] = await prisma.$queryRaw<
      { first: Date | null; lastOk: Date | null; lastFailAt: Date | null; lastFailDetail: string | null }[]
    >`
      SELECT
        (SELECT MIN("createdAt") FROM "AiCall") AS "first",
        (SELECT MAX("createdAt") FROM "AiCall" WHERE "ok") AS "lastOk",
        f."createdAt" AS "lastFailAt",
        f."errorDetail" AS "lastFailDetail"
      FROM (SELECT 1) AS one
      LEFT JOIN LATERAL (
        SELECT "createdAt", "errorDetail" FROM "AiCall"
        WHERE NOT "ok" AND "errorCode" IN ('ai_unavailable', 'ai_misconfigured')
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) AS f ON true
    `;

    const ongoingFailure =
      meta?.lastFailAt && (!meta.lastOk || meta.lastFailAt > meta.lastOk)
        ? { at: meta.lastFailAt, detail: meta.lastFailDetail || "Unknown error" }
        : null;

    return {
      summary: summariseCalls(rows, now),
      recent: recentRows.map(({ user, ...r }) => ({ ...r, email: user?.email ?? null })),
      trackingSince: meta?.first ?? null,
      ongoingFailure,
    };
  } catch (err) {
    console.error("[admin] could not load AI activity (has the AiCall migration run?):", err);
    return null;
  }
}

export type SiteCounts = {
  users: number;
  searchesTotal: number;
  searchesMonth: number;
  searches24h: number;
  saved: number;
  tracked: number;
  /** Accounts per plan; unrecognised plan values are folded into free. */
  plans: Record<string, number>;
};

/**
 * The dashboard's headline counts in two round trips instead of seven, for the
 * same connection_limit=1 reason as above.
 */
export async function getSiteCounts(now = new Date()): Promise<SiteCounts> {
  const since24h = new Date(now.getTime() - DAY_MS);
  const monthStart = currentPeriodStart(now);

  const [c] = await prisma.$queryRaw<
    {
      users: bigint;
      searchesTotal: bigint;
      searchesMonth: bigint;
      searches24h: bigint;
      saved: bigint;
      tracked: bigint;
    }[]
  >`
    SELECT
      (SELECT COUNT(*) FROM "User") AS "users",
      (SELECT COUNT(*) FROM "Search") AS "searchesTotal",
      (SELECT COUNT(*) FROM "Search" WHERE "createdAt" >= ${monthStart}) AS "searchesMonth",
      (SELECT COUNT(*) FROM "Search" WHERE "createdAt" >= ${since24h}) AS "searches24h",
      (SELECT COUNT(*) FROM "SavedProduct") AS "saved",
      (SELECT COUNT(*) FROM "TrackedProduct") AS "tracked"
  `;

  const byPlan = await prisma.user.groupBy({ by: ["plan"], _count: { _all: true } });
  const plans: Record<string, number> = { free: 0, pro: 0, premium: 0 };
  for (const row of byPlan) {
    // Matches how getPlan() treats an unknown value everywhere else, so the
    // per-plan figures add up to the account total.
    const key = row.plan in plans ? row.plan : "free";
    plans[key] += row._count._all;
  }

  return {
    users: Number(c.users),
    searchesTotal: Number(c.searchesTotal),
    searchesMonth: Number(c.searchesMonth),
    searches24h: Number(c.searches24h),
    saved: Number(c.saved),
    tracked: Number(c.tracked),
    plans,
  };
}
