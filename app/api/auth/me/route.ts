import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { getUsage } from "@/lib/usage";

/**
 * Current session, plus the caller's plan and this month's search usage.
 *
 * Usage is returned here rather than from a separate endpoint so the app needs
 * one request on load. The plan is read from the database, not the session
 * cookie, so a plan change applies immediately instead of after re-login.
 */
export async function GET() {
  return handle("api:auth:me", async () => {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ user: null });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, plan: true },
    });

    // The cookie verified but the row is gone (deleted account, reset database).
    if (!user) return NextResponse.json({ user: null });

    const usage = await getUsage(user.id, user.plan);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: usage.plan.id },
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        resetsAt: usage.resetsAt,
        planName: usage.plan.name,
      },
    });
  });
}
