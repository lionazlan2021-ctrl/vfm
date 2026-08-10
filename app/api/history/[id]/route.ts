import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { apiError, handle } from "@/lib/http";
import { SearchResultSchema } from "@/lib/ai";

/**
 * Replays a stored search result.
 *
 * Search results were being written to the database and never read back: the
 * sidebar re-ran the whole query through Anthropic, so opening your own history
 * cost money every time. This returns the saved result instead.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle("api:history:id", async () => {
    const session = await getCurrentSession();
    if (!session) return apiError("unauthorized", "Log in to open a past search.");

    const { id } = await ctx.params;

    const search = await prisma.search.findFirst({
      // Scoped by userId so an id from another account resolves to nothing.
      where: { id, userId: session.userId },
    });
    if (!search) return apiError("not_found", "That search is no longer in your history.");

    let result: unknown;
    try {
      result = JSON.parse(search.resultJson);
    } catch {
      console.error(`[api:history:id] search ${id} holds unreadable JSON`);
      return apiError("not_found", "That saved result could not be read. Please run the search again.");
    }

    const parsed = SearchResultSchema.safeParse(result);
    if (!parsed.success) {
      // Written by an older version of the app whose shape has since changed.
      return apiError("not_found", "That saved result is in an older format. Please run the search again.");
    }

    return NextResponse.json({
      id: search.id,
      query: search.query,
      createdAt: search.createdAt,
      result: parsed.data,
    });
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle("api:history:id", async () => {
    const session = await getCurrentSession();
    if (!session) return apiError("unauthorized", "Log in to manage your history.");

    const { id } = await ctx.params;
    const { count } = await prisma.search.deleteMany({ where: { id, userId: session.userId } });
    if (count === 0) return apiError("not_found", "That search is no longer in your history.");

    return NextResponse.json({ success: true });
  });
}
