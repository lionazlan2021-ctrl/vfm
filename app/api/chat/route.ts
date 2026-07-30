import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askFollowUp } from "@/lib/ai";
import { getCurrentSession } from "@/lib/auth";
import { apiError, handle, readJson } from "@/lib/http";
import { callerKey, hit, LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * Follow-up chat is a paid Anthropic call, so it requires a session. Previously
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

    const rl = hit(
      callerKey(req, session.userId),
      LIMITS.chatUser.limit,
      LIMITS.chatUser.windowSeconds
    );
    if (!rl.ok) {
      return apiError("rate_limited", "You've hit the hourly chat limit. Please try again shortly.", {
        headers: rateLimitHeaders(rl),
      });
    }

    const body = await readJson(req, ChatSchema, { maxBytes: 128 * 1024 });

    const reply = await askFollowUp({
      history: body.history ?? [],
      originalQuery: body.originalQuery ?? "",
      productContext: body.productContext,
      userMessage: body.userMessage,
    });

    return NextResponse.json({ reply }, { headers: rateLimitHeaders(rl) });
  });
}
