import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { apiError, handle } from "@/lib/http";

export async function GET() {
  return handle("api:history", async () => {
    const session = await getCurrentSession();
    // Was a 200 with an empty list, which made "logged out" indistinguishable
    // from "no searches yet". Now consistent with /api/saved and /api/tracked.
    if (!session) return apiError("unauthorized", "Log in to see your search history.");

    const searches = await prisma.search.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      // resultJson is deliberately excluded — it is large, and the list view
      // only needs labels. Fetch one entry's result via /api/history/[id].
      select: { id: true, query: true, createdAt: true },
    });

    return NextResponse.json({ history: searches });
  });
}
