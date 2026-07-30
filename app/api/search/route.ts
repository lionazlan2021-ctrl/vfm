import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, imageBase64, imageMediaType } = body as {
      query?: string;
      imageBase64?: string;
      imageMediaType?: string;
    };

    if (!query?.trim() && !imageBase64) {
      return NextResponse.json({ error: "Provide a query or an image." }, { status: 400 });
    }

    const result = await searchProducts({ query: query || "", imageBase64, imageMediaType });

    // If the user is logged in, save this search to their history (real DB write).
    const session = await getCurrentSession();
    if (session) {
      await prisma.search.create({
        data: {
          userId: session.userId,
          query: query || "Image search",
          resultJson: JSON.stringify(result),
        },
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Search API error:", err);
    const message = err?.message?.includes("ANTHROPIC_API_KEY")
      ? "The AI service is not configured. Add a real ANTHROPIC_API_KEY to your .env file."
      : "Search failed. The AI service may be temporarily unavailable. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
