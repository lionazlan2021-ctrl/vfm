import { NextRequest, NextResponse } from "next/server";
import { apiError, handle } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { pingAi } from "@/lib/ai";
import { PLANS } from "@/lib/plans";
import { callerKey, hit, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * Live AI check, run when an admin presses "Test AI connection". POST rather
 * than GET because it spends (a fraction of a cent) — a GET could be fired by
 * a prefetch or a crawler.
 *
 * Tests the Free plan's model: it carries most traffic, and the Free plan is
 * what visitors who aren't signed in run on.
 */
export async function POST(req: NextRequest) {
  return handle("api:admin:health", async () => {
    const admin = await requireAdmin();

    const rl = hit(callerKey(req, `admin-health:${admin.id}`), 20, 60 * 60);
    if (!rl.ok) {
      return apiError("rate_limited", "That's a lot of checks — try again in a while.", {
        headers: rateLimitHeaders(rl),
      });
    }

    return NextResponse.json(await pingAi(PLANS.free.model));
  });
}
