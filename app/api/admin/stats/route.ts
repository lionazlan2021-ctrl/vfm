import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { currentPeriodStart } from "@/lib/plans";

/** Dashboard totals. Admin only. */
export async function GET() {
  return handle("api:admin:stats", async () => {
    await requireAdmin();

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const monthStart = currentPeriodStart();

    // Counted in parallel — these are independent aggregates and the dashboard
    // needs all of them before it can render anything.
    const [users, searchesTotal, searchesMonth, searches24h, saved, tracked, byPlan] =
      await Promise.all([
        prisma.user.count(),
        prisma.search.count(),
        prisma.search.count({ where: { createdAt: { gte: monthStart } } }),
        prisma.search.count({ where: { createdAt: { gte: since24h } } }),
        prisma.savedProduct.count(),
        prisma.trackedProduct.count(),
        prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
      ]);

    const plans: Record<string, number> = { free: 0, pro: 0, premium: 0 };
    for (const row of byPlan) {
      // Unrecognised plan values are folded into free, matching how getPlan()
      // treats them everywhere else — otherwise the dashboard total wouldn't
      // add up to the user count.
      const key = row.plan in plans ? row.plan : "free";
      plans[key] += row._count._all;
    }

    return NextResponse.json({
      users,
      searchesTotal,
      searchesMonth,
      searches24h,
      saved,
      tracked,
      plans,
    });
  });
}
