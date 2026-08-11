import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { PLANS, PLAN_ORDER, currentPeriodStart } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Admin overview.
 *
 * Reads the database directly rather than fetching /api/admin/stats — this is a
 * server component, so an internal HTTP round trip would add latency and an
 * auth hop for no benefit. The API route exists for anything client-side.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const monthStart = currentPeriodStart();

  const [users, searchesTotal, searchesMonth, searches24h, saved, tracked, byPlan, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.search.count(),
      prisma.search.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.search.count({ where: { createdAt: { gte: since24h } } }),
      prisma.savedProduct.count(),
      prisma.trackedProduct.count(),
      prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
      prisma.search.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          query: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

  const planCounts: Record<string, number> = { free: 0, pro: 0, premium: 0 };
  for (const row of byPlan) {
    const key = row.plan in planCounts ? row.plan : "free";
    planCounts[key] += row._count._all;
  }

  return (
    <main className="px-5 md:px-10 lg:px-14 py-10 md:py-14">
      <p className="eyebrow mb-4">Overview</p>
      <h1
        className="display mb-10"
        style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", color: "var(--ink)", maxWidth: "16ch" }}
      >
        How VFM is <span style={{ color: "var(--accent)" }}>doing.</span>
      </h1>

      <section
        className="grid gap-4 mb-12"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}
      >
        <Stat label="Accounts" value={users} />
        <Stat label="Searches, all time" value={searchesTotal} />
        <Stat label="Searches, this month" value={searchesMonth} />
        <Stat label="Searches, last 24h" value={searches24h} />
        <Stat label="Saved listings" value={saved} />
        <Stat label="Tracked listings" value={tracked} />
      </section>

      <section className="mb-12">
        <h2 className="eyebrow mb-4">Accounts by plan</h2>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
        >
          {PLAN_ORDER.map((id) => (
            <div key={id} className="card p-5">
              <p className="eyebrow mb-2">{PLANS[id].name}</p>
              <p className="numeric" style={{ fontSize: "1.9rem", color: "var(--ink)" }}>
                {planCounts[id]}
              </p>
              <p className="text-[13px] mt-2" style={{ color: "var(--ink-mute)" }}>
                {PLANS[id].searchesPerMonth.toLocaleString()} searches/mo &middot;{" "}
                {PLANS[id].model.replace(/-\d{8}$/, "")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4 gap-4">
          <h2 className="eyebrow">Latest searches</h2>
          <Link href="/admin/users" className="text-[13px]" style={{ color: "var(--accent)" }}>
            Manage users
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-[14px]" style={{ color: "var(--ink-mute)" }}>
              No searches yet.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div style={{ overflowX: "auto" }}>
              <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "520px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    <Th>Query</Th>
                    <Th>Account</Th>
                    <Th align="right">When</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <Td>{s.query}</Td>
                      <Td muted>{s.user.email}</Td>
                      <Td align="right" muted mono>
                        {s.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className="numeric" style={{ fontSize: "1.9rem", color: "var(--ink)" }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className="eyebrow"
      style={{ textAlign: align, padding: "11px 16px", fontWeight: 500 }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  muted,
  mono,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={mono ? "numeric" : undefined}
      style={{
        textAlign: align,
        padding: "13px 16px",
        fontSize: "13.5px",
        color: muted ? "var(--ink-mute)" : "var(--ink)",
      }}
    >
      {children}
    </td>
  );
}
