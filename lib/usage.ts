import { prisma } from "./prisma";
import { getPlan, currentPeriodStart, nextPeriodStart, type Plan } from "./plans";

/**
 * Monthly quota accounting.
 *
 * Searches are counted from the `Search` table rather than a separate counter,
 * so the number shown to the user is derived from the same rows that back their
 * history — there is no second source of truth to drift.
 *
 * The window is the calendar month in UTC.
 */

export type Usage = {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  /** ISO timestamp of the next quota reset. */
  resetsAt: string;
  exhausted: boolean;
};

export async function getUsage(userId: string, planValue: unknown): Promise<Usage> {
  const plan = getPlan(planValue);
  const used = await prisma.search.count({
    where: { userId, createdAt: { gte: currentPeriodStart() } },
  });

  const limit = plan.searchesPerMonth;
  return {
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: nextPeriodStart().toISOString(),
    exhausted: used >= limit,
  };
}

/** Human-readable reset time, e.g. "1 August". */
export function formatResetDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
