import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const tracked = await prisma.trackedProduct.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    tracked: tracked.map((t) => ({
      id: t.id,
      query: t.query,
      store: t.store,
      price: t.price,
      listing: JSON.parse(t.listingJson),
      createdAt: t.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json();
  const { query, listing } = body as { query: string; listing: { store: string; price: string } };

  if (!query || !listing?.store || !listing?.price) {
    return NextResponse.json({ error: "Missing query or listing data." }, { status: 400 });
  }

  const created = await prisma.trackedProduct.create({
    data: {
      userId: session.userId,
      query,
      store: listing.store,
      price: listing.price,
      listingJson: JSON.stringify(listing),
    },
  });

  return NextResponse.json({ id: created.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await prisma.trackedProduct.deleteMany({ where: { id, userId: session.userId } });
  return NextResponse.json({ success: true });
}
