import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "./prisma";
import { getCurrentSession } from "./auth";
import { apiError, handle, readJson } from "./http";
import { callerKey, hit, LIMITS, rateLimitHeaders } from "./rate-limit";
import type { Listing } from "@/types";

/**
 * `SavedProduct` and `TrackedProduct` are the same shape and the same three
 * operations, so both routes are built from this one implementation. Previously
 * they were duplicated files, which meant every fix had to be made twice.
 */

const ListingInput = z.object({
  store: z.string().trim().min(1, "Listing is missing a store name.").max(120),
  price: z.string().trim().min(1, "Listing is missing a price.").max(60),
  originalPrice: z.string().max(60).nullable().optional(),
  condition: z.string().max(60).optional(),
  shipping: z.string().max(120).optional(),
  delivery: z.string().max(120).optional(),
  warranty: z.string().max(160).optional(),
  sellerRating: z.number().min(0).max(5).nullable().optional(),
  valueScore: z.number().min(0).max(10).optional(),
  buyUrl: z.string().url().max(2000).optional(),
  emoji: z.string().max(16).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  pros: z.array(z.string().max(300)).max(10).optional(),
  cons: z.array(z.string().max(300)).max(10).optional(),
  aiReason: z.string().max(1000).optional(),
});

const CreateSchema = z.object({
  query: z.string().trim().min(1, "Missing the search this listing came from.").max(300),
  listing: ListingInput,
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1, "Missing the id of the item to remove.").max(64),
});

/**
 * Rows are written as JSON text, so a malformed row would throw inside `.map()`
 * and take down the whole list request. Bad rows are skipped and logged instead.
 */
function parseListing(json: string, id: string): Listing | null {
  try {
    const parsed = ListingInput.safeParse(JSON.parse(json));
    return parsed.success ? (parsed.data as Listing) : null;
  } catch {
    console.error(`[listing-collection] row ${id} holds unreadable JSON; skipping`);
    return null;
  }
}

type CollectionName = "saved" | "tracked";

type Row = {
  id: string;
  userId: string;
  query: string;
  store: string;
  price: string;
  listingJson: string;
  createdAt: Date;
};

/**
 * The subset of the Prisma delegate this module uses.
 *
 * `SavedProduct` and `TrackedProduct` are declared with identical fields in
 * schema.prisma, but Prisma generates a distinct delegate type per model, and
 * TypeScript will not call a union of two generic delegates. Narrowing to the
 * operations both genuinely share is what makes one implementation serve both;
 * if the two models ever diverge in the schema, `Row` stops matching and this
 * fails to compile.
 */
type ListingDelegate = {
  findMany(args: {
    where: { userId: string };
    orderBy: { createdAt: "desc" };
    take: number;
  }): Promise<Row[]>;
  findFirst(args: {
    where: { userId: string; query: string; store: string };
  }): Promise<Row | null>;
  create(args: {
    data: { userId: string; query: string; store: string; price: string; listingJson: string };
  }): Promise<Row>;
  deleteMany(args: { where: { id: string; userId: string } }): Promise<{ count: number }>;
};

function delegateFor(name: CollectionName): ListingDelegate {
  const delegate = name === "saved" ? prisma.savedProduct : prisma.trackedProduct;
  return delegate as unknown as ListingDelegate;
}

export function createCollectionRoutes(name: CollectionName) {
  const label = `api:${name}`;

  return {
    GET: async (req: NextRequest) =>
      handle(label, async () => {
        const session = await getCurrentSession();
        if (!session) return apiError("unauthorized", "Log in to see your list.");

        const rows = await delegateFor(name).findMany({
          where: { userId: session.userId },
          orderBy: { createdAt: "desc" },
          take: 200,
        });

        const items = rows
          .map((row) => {
            const listing = parseListing(row.listingJson, row.id);
            if (!listing) return null;
            return {
              id: row.id,
              query: row.query,
              store: row.store,
              price: row.price,
              listing,
              createdAt: row.createdAt,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);

        return NextResponse.json({ [name]: items });
      }),

    POST: async (req: NextRequest) =>
      handle(label, async () => {
        const session = await getCurrentSession();
        if (!session) return apiError("unauthorized", "Log in to save listings.");

        const rl = hit(callerKey(req, session.userId), LIMITS.write.limit, LIMITS.write.windowSeconds);
        if (!rl.ok) {
          return apiError("rate_limited", "Too many requests. Please slow down.", {
            headers: rateLimitHeaders(rl),
          });
        }

        const { query, listing } = await readJson(req, CreateSchema, { maxBytes: 32 * 1024 });

        // The UI identifies an entry by query + store, so a second row with the
        // same pair would make the toggle ambiguous. Return the existing row.
        const existing = await delegateFor(name).findFirst({
          where: { userId: session.userId, query, store: listing.store },
        });
        if (existing) {
          return NextResponse.json({ id: existing.id, alreadyExisted: true });
        }

        const created = await delegateFor(name).create({
          data: {
            userId: session.userId,
            query,
            store: listing.store,
            price: listing.price,
            listingJson: JSON.stringify(listing),
          },
        });

        return NextResponse.json({ id: created.id }, { status: 201 });
      }),

    DELETE: async (req: NextRequest) =>
      handle(label, async () => {
        const session = await getCurrentSession();
        if (!session) return apiError("unauthorized", "Log in to manage your list.");

        const { id } = await readJson(req, DeleteSchema, { maxBytes: 4 * 1024 });

        // Scoped to the session user, so one account can't delete another's row.
        const { count } = await delegateFor(name).deleteMany({
          where: { id, userId: session.userId },
        });

        if (count === 0) {
          return apiError("not_found", "That item is no longer in your list.");
        }
        return NextResponse.json({ success: true });
      }),
  };
}
