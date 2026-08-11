import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, handle, readJson } from "@/lib/http";
import { requireAdmin, ADMIN_ROLE } from "@/lib/admin";
import { PLAN_ORDER } from "@/lib/plans";

/** Change a user's plan or role. Admin only. */

const PatchSchema = z
  .object({
    plan: z.enum(PLAN_ORDER as [string, ...string[]]).optional(),
    role: z.enum(["user", "admin"]).optional(),
  })
  .refine((v) => v.plan !== undefined || v.role !== undefined, {
    message: "Provide a plan or a role to change.",
  });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle("api:admin:users:patch", async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const body = await readJson(req, PatchSchema, { maxBytes: 4 * 1024 });

    // An admin demoting themselves would immediately lose access to this page,
    // and if they were the only admin nobody could undo it without database
    // access. Changing someone else's role is fine.
    if (body.role && body.role !== ADMIN_ROLE && id === admin.id) {
      return apiError("bad_request", "You can't remove your own admin access.");
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) return apiError("not_found", "No account with that id.");

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.plan ? { plan: body.plan } : {}),
        ...(body.role ? { role: body.role } : {}),
      },
      select: { id: true, email: true, name: true, plan: true, role: true },
    });

    // Plan and role are both read from the database on every request, so this
    // takes effect on the user's next request — no re-login needed.
    console.log(
      `[admin] ${admin.email} updated ${user.email}:`,
      JSON.stringify({ plan: body.plan, role: body.role })
    );

    return NextResponse.json({ user });
  });
}
