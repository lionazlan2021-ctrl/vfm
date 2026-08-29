import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchProducts, isSupportedImageType, SUPPORTED_IMAGE_TYPES } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { apiError, handle, readJson } from "@/lib/http";
import { callerKey, hit, LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { getPlan } from "@/lib/plans";
import { getUsage, formatResetDate } from "@/lib/usage";

/**
 * Roughly 3.4 MB of original image once base64 is decoded. Anthropic accepts up
 * to 5 MB per image; staying under that avoids paying for a request that will
 * be rejected anyway.
 */
const MAX_IMAGE_BASE64_CHARS = 4_500_000;
const MAX_BODY_BYTES = 6 * 1024 * 1024;

const SearchSchema = z
  .object({
    query: z.string().max(300, "Search is limited to 300 characters.").optional(),
    imageBase64: z
      .string()
      .max(MAX_IMAGE_BASE64_CHARS, "That image is too large. Please use one under 3 MB.")
      .optional(),
    imageMediaType: z.string().optional(),
  })
  .refine((d) => Boolean(d.query?.trim()) || Boolean(d.imageBase64), {
    message: "Enter a product to search for, or upload a photo.",
  })
  .refine((d) => !d.imageBase64 || Boolean(d.imageMediaType), {
    message: "The uploaded image is missing its file type.",
  })
  .refine((d) => !d.imageMediaType || isSupportedImageType(d.imageMediaType), {
    message: `Unsupported image type. Use one of: ${SUPPORTED_IMAGE_TYPES.join(", ")}.`,
  });

export async function POST(req: NextRequest) {
  return handle("search", async () => {
    const session = await getCurrentSession();

    // Anonymous visitors get a much smaller allowance than signed-in users:
    // every call here is a paid Anthropic web search.
    const { limit, windowSeconds } = session ? LIMITS.searchUser : LIMITS.searchAnon;
    const rl = hit(callerKey(req, session?.userId), limit, windowSeconds);
    if (!rl.ok) {
      return apiError(
        "rate_limited",
        session
          ? "You've hit the hourly search limit. Please try again shortly."
          : "Search limit reached. Log in or create a free account for a higher limit.",
        { headers: rateLimitHeaders(rl) }
      );
    }

    const body = await readJson(req, SearchSchema, { maxBytes: MAX_BODY_BYTES });
    const query = body.query?.trim() || "";

    // The plan is read from the database, not the session cookie, so an upgrade
    // takes effect immediately instead of after the user next logs in.
    let plan = getPlan(undefined);
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { plan: true },
      });
      const usage = await getUsage(session.userId, user?.plan);
      plan = usage.plan;

      if (usage.exhausted) {
        return apiError(
          "rate_limited",
          `You've used all ${usage.limit} searches on the ${plan.name} plan this month. Your quota resets on ${formatResetDate(usage.resetsAt)}.`,
          { headers: rateLimitHeaders(rl) }
        );
      }
    }

    const result = await searchProducts({
      query,
      imageBase64: body.imageBase64,
      imageMediaType: body.imageMediaType as never,
      model: plan.model,
      effort: plan.searchEffort,
      maxSearches: plan.maxSearches,
      sellers: plan.sellersCompared,
      maxTokens: plan.maxTokens,
    });

    // Record the search for signed-in users. A history write must never sink an
    // otherwise-good result the user already paid for.
    let searchId: string | undefined;
    if (session) {
      try {
        const saved = await prisma.search.create({
          data: {
            userId: session.userId,
            query: query || "Image search",
            resultJson: JSON.stringify(result),
          },
        });
        searchId = saved.id;
      } catch (err) {
        console.error("[search] could not save to history:", err);
      }
    }

    return NextResponse.json({ ...result, searchId }, { headers: rateLimitHeaders(rl) });
  });
}
