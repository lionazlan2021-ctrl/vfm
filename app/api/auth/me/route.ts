import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { getUsage } from "@/lib/usage";
import { isGoogleConfigured } from "@/lib/google-oauth";
import { isAdminIdentity } from "@/lib/admin";

/**
 * Current session, plus the caller's plan and this month's search usage.
 *
 * Usage is returned here rather than from a separate endpoint so the app needs
 * one request on load. The plan and role are read from the database, not the
 * session cookie, so a change to either applies immediately instead of after
 * re-login.
 *
 * `googleEnabled` tells the auth dialog whether to offer the Google button —
 * showing it when the server has no client ID configured would just send people
 * to a dead redirect.
 */
export async function GET() {
  return handle("api:auth:me", async () => {
    const googleEnabled = isGoogleConfigured();

    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ user: null, googleEnabled });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, plan: true, role: true, image: true },
    });

    // The cookie verified but the row is gone (deleted account, reset database).
    if (!user) return NextResponse.json({ user: null, googleEnabled });

    const usage = await getUsage(user.id, user.plan);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: usage.plan.id,
        image: user.image,
        // The same predicate the route guard uses, so the sidebar link and
        // actual access can't disagree.
        isAdmin: isAdminIdentity(user),
      },
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        resetsAt: usage.resetsAt,
        planName: usage.plan.name,
      },
      googleEnabled,
    });
  });
}
