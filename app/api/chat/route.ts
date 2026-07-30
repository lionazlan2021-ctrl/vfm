import { NextRequest, NextResponse } from "next/server";
import { askFollowUp, type ChatTurn } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, originalQuery, productContext, userMessage } = body as {
      history: ChatTurn[];
      originalQuery: string;
      productContext: unknown;
      userMessage: string;
    };

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const reply = await askFollowUp({
      history: history || [],
      originalQuery: originalQuery || "",
      productContext,
      userMessage,
    });

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    const message = err?.message?.includes("ANTHROPIC_API_KEY")
      ? "The AI service is not configured. Add a real ANTHROPIC_API_KEY to your .env file."
      : "Couldn't reach the AI. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
