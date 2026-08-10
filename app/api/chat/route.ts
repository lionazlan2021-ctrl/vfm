import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askFollowUp } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { getCurrentSession } from "@/lib/auth";
import { apiError, handle, readJson } from "@/lib/http";
import { callerKey, hit, LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * Follow-up chat is a paid Gemini call, so it requires a session. Previously
 * this route had no auth check and no rate limit at all, which left an
 * unauthenticated, unmetered path straight to the API.
 */

const ChatSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional(),
  originalQuery: z.string().max(300).optional(),
  // Bounded in lib/ai before being interpolated into the system prompt.
  productContext: z.unknown().optional(),
  userMessage: z
    .string()
    .trim()
    .min(1, "Type a question first.")
    .max(1000, "That question is too long — keep it under 1000 characters."),
});

export async function POST(req: NextRequest) {
  return handle("chat", async () => {
    const session = await getCurrentSession();
    if (!session) {
      return apiError("unauthorized", "Log in to ask follow-up questions.");
    }

    // Plan comes from the database so an upgrade applies without re-login.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    });
    const plan = getPlan(user?.plan);

    const rl = hit(callerKey(req, session.userId), plan.chatPerHour, LIMITS.chatUser.windowSeconds);
    if (!rl.ok) {
      return apiError(
        "rate_limited",
        `You've hit the hourly follow-up limit for the ${plan.name} plan. Please try again shortly.`,
        { headers: rateLimitHeaders(rl) }
      );
    }

    const body = await readJson(req, ChatSchema, { maxBytes: 128 * 1024 });

    const reply = await askFollowUp({
      history: body.history ?? [],
      originalQuery: body.originalQuery ?? "",
      productContext: body.productContext,
      userMessage: body.userMessage,
      model: plan.model,
    });

    return NextResponse.json({ reply }, { headers: rateLimitHeaders(rl) });
  });
}
