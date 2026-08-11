import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { requireAdmin, isConfiguredAdminEmail } from "@/lib/admin";
import { currentPeriodStart } from "@/lib/plans";

/**
 * User list for the admin panel. Admin only.
 *
 * Paginated because this table grows without bound — an admin panel that does
 * `findMany()` with no take is fine on day one and a timeout later.
 */

const PAGE_SIZE = 25;

const QuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export async function GET(req: NextRequest) {
  return handle("api:admin:users", async () => {
    await requireAdmin();

    const parsed = QuerySchema.safeParse({
      q: req.nextUrl.searchParams.get("q") ?? undefined,
      page: req.nextUrl.searchParams.get("page") ?? 1,
    });
    // A malformed query string shouldn't 400 a dashboard — fall back to page 1.
    const { q, page } = parsed.success ? parsed.data : { q: undefined, page: 1 };

    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          role: true,
          createdAt: true,
          googleId: true,
          passwordHash: true,
          _count: { select: { searches: true, saved: true, tracked: true } },
        },
      }),
    ]);

    // This month's searches per user, for the quota column. One grouped query
    // rather than a count per row.
    const ids = users.map((u) => u.id);
    const monthly = ids.length
      ? await prisma.search.groupBy({
          by: ["userId"],
          where: { userId: { in: ids }, createdAt: { gte: currentPeriodStart() } },
          _count: { _all: true },
        })
      : [];
    const monthlyByUser = new Map(monthly.map((m) => [m.userId, m._count._all]));

    return NextResponse.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        role: u.role,
        // Admin via ADMIN_EMAILS rather than the role column. Surfaced so the
        // table can say so and disable the role control — that dropdown cannot
        // revoke this kind of admin, and shouldn't look like it can.
        isConfiguredAdmin: isConfiguredAdminEmail(u.email),
        createdAt: u.createdAt.toISOString(),
        // The hash itself never leaves the server — only whether one exists,
        // which is what tells an admin how this person signs in.
        hasPassword: u.passwordHash !== null,
        hasGoogle: u.googleId !== null,
        searchesTotal: u._count.searches,
        searchesThisMonth: monthlyByUser.get(u.id) ?? 0,
        saved: u._count.saved,
        tracked: u._count.tracked,
      })),
    });
  });
}
