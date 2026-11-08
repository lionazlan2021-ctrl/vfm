import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { getSiteCounts } from "@/lib/admin-stats";

/** Dashboard totals. Admin only. */
export async function GET() {
  return handle("api:admin:stats", async () => {
    await requireAdmin();
    return NextResponse.json(await getSiteCounts());
  });
}
