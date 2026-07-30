import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE")) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add a real key to your .env file. Get one at https://console.anthropic.com/settings/keys"
    );
  }
  return new Anthropic({ apiKey });
}

function extractJSON(text: string): any {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}") + 1;
  if (start === -1 || end <= start) {
    throw new Error("AI response did not contain a valid JSON object.");
  }
  return JSON.parse(clean.slice(start, end));
}

const SEARCH_SYSTEM = `You are VFM AI — Value For Money — a real-time shopping intelligence engine.

Your job: use the web_search tool to find the SAME exact product from 3 DIFFERENT trusted sellers/marketplaces (e.g. Amazon, Best Buy, Walmart, Noon, eBay, B&H Photo, Newegg, AliExpress, Target). Search the web for real, current listings before answering — do not guess prices from memory.

After searching, respond with ONLY a single valid JSON object. No markdown fences, no commentary before or after.

JSON structure:
{
  "productSummary": "One-line description of the exact product identified",
  "listing1": {
    "store": "Amazon",
    "price": "$XXX.XX",
    "originalPrice": "$XXX.XX or null",
    "condition": "New",
    "shipping": "Free shipping",
    "delivery": "2-3 business days",
    "warranty": "1 year manufacturer",
    "sellerRating": 4.8,
    "valueScore": 9,
    "buyUrl": "https://amazon.com/...",
    "emoji": "📦",
    "pros": ["pro 1", "pro 2"],
    "cons": ["con 1"],
    "aiReason": "Why this listing is good value, 1-2 sentences, based on what you found."
  },
  "listing2": { "...same shape, different store" },
  "listing3": { "...same shape, a third different store" },
  "verdict": "2-sentence verdict on which listing to choose and why.",
  "recommendation": 1
}

Rules:
- listing1 must be the best overall price/value found via search
- All 3 listings must be different stores
- Use real prices and URLs found through search wherever possible
- valueScore 1-10, weighted toward price-to-quality and trust
- If search results are thin, say so honestly inside aiReason rather than inventing specifics`;

export type SearchParams = {
  query: string;
  imageBase64?: string;
  imageMediaType?: string;
};

/** Real AI product search — calls Claude with live web search enabled. */
export async function searchProducts({ query, imageBase64, imageMediaType }: SearchParams) {
  const client = getClient();

  const content: Anthropic.MessageParam["content"] = [];
  if (imageBase64 && imageMediaType) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: imageMediaType as any, data: imageBase64 },
    });
    content.push({
      type: "text",
      text: query
        ? `Identify this exact product, then search the web and find the best prices from 3 different sellers. Extra context: ${query}`
        : "Identify this exact product, then search the web and find the best prices from 3 different trusted sellers.",
    });
  } else {
    content.push({ type: "text", text: `Search the web and find the best prices for: ${query}` });
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2200,
    system: SEARCH_SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search" } as any],
    messages: [{ role: "user", content }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return extractJSON(text);
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Real follow-up chat — maintains context from the original search. */
export async function askFollowUp({
  history,
  originalQuery,
  productContext,
  userMessage,
}: {
  history: ChatTurn[];
  originalQuery: string;
  productContext: unknown;
  userMessage: string;
}) {
  const client = getClient();

  const system = `You are VFM AI, a concise, knowledgeable personal shopping advisor. The user searched for: "${originalQuery}". Here is the product/listing data from that search: ${JSON.stringify(
    productContext
  ).slice(0, 1400)}. Use this context plus general product knowledge to answer the user's follow-up question directly and helpfully. If something isn't in the listing data, say so honestly rather than guessing. Keep answers to 2-4 sentences unless asked for more detail.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system,
    messages: [...history.map((h) => ({ role: h.role, content: h.content })), { role: "user", content: userMessage }],
  });

  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block?.text || "I couldn't generate a response. Please try rephrasing.";
}
