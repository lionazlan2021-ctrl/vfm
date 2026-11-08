import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminUser, configuredAdminEmails } from "@/lib/admin";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import {
  getAiActivity,
  getSiteCounts,
  type AiActivity,
  type Bucket,
  type DayBucket,
} from "@/lib/admin-stats";
import { formatUsd } from "@/lib/pricing";
import { isMockMode } from "@/lib/ai";
import { isGoogleConfigured } from "@/lib/google-oauth";
import AiHealthCheck from "@/components/admin/AiHealthCheck";

export const dynamic = "force-dynamic";

/**
 * Admin overview.
 *
 * Reads the database directly rather than fetching /api/admin/stats — this is a
 * server component, so an internal HTTP round trip would add latency and an
 * auth hop for no benefit. The API route exists for anything client-side.
 *
 * Order is deliberate: is anything broken, then what is it costing, then what
 * are people doing. The first two are the questions an owner opens this page
 * to answer.
 */
export default async function AdminOverviewPage() {
  // The layout shows the sign-in form to non-admins; this just makes sure no
  // data is ever read for them.
  if (!(await getAdminUser())) return null;

  const dbStarted = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatencyMs = Date.now() - dbStarted;

  // One after the other: see getAiActivity for why these aren't parallel.
  const activity = await getAiActivity();
  const { users, searchesTotal, searchesMonth, searches24h, saved, tracked, plans: planCounts } =
    await getSiteCounts();

  const checks = healthChecks(activity, dbLatencyMs);

  return (
    <main className="px-5 md:px-10 lg:px-14 py-10 md:py-14">
      <p className="eyebrow mb-4">Overview</p>
      <h1
        className="display mb-10"
        style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", color: "var(--ink)", maxWidth: "16ch" }}
      >
        How VFM is <span style={{ color: "var(--accent)" }}>doing.</span>
      </h1>

      {/* ---------------------------------------------------------- Health */}
      <section className="mb-14" aria-labelledby="health-heading">
        <h2 id="health-heading" className="eyebrow mb-4">
          Health
        </h2>
        <div className="card overflow-hidden mb-4">
          <ul>
            {checks.map((c, i) => (
              <li
                key={c.label}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3.5"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--rule)" }}
              >
                <span className="flex items-center gap-2.5 min-w-[190px]">
                  <StatusDot status={c.status} />
                  <span className="text-[14px]" style={{ color: "var(--ink)" }}>
                    {c.label}
                  </span>
                </span>
                <span
                  className="text-[13.5px] flex-1 min-w-[220px]"
                  style={{ color: c.status === "fail" ? "var(--alert)" : "var(--ink-mute)" }}
                >
                  {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <AiHealthCheck />
      </section>

      {/* -------------------------------------------------------- AI spend */}
      <section className="mb-14" aria-labelledby="spend-heading">
        <h2 id="spend-heading" className="eyebrow mb-2">
          AI spend
        </h2>
        <p className="text-[13px] mb-5 max-w-prose" style={{ color: "var(--ink-mute)" }}>
          Estimated from Anthropic&apos;s published prices, for every search and chat — logged
          in or not, worked or failed.{" "}
          {activity?.trackingSince
            ? `Tracking since ${formatDate(activity.trackingSince)}; anything earlier isn't included.`
            : "Nothing has been logged yet."}{" "}
          The exact bill is at console.anthropic.com.
        </p>

        {activity ? (
          <>
            <div
              className="grid gap-4 mb-6"
              style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}
            >
              <SpendCard label="Today (UTC)" bucket={activity.summary.today} />
              <SpendCard label="Last 7 days" bucket={activity.summary.last7Days} />
              <SpendCard label="This month" bucket={activity.summary.thisMonth} />
              <div className="card p-5">
                <p className="eyebrow mb-2">Average search</p>
                <p className="numeric" style={{ fontSize: "1.9rem", color: "var(--ink)" }}>
                  {activity.summary.avgSuccessfulSearch === null
                    ? "—"
                    : formatUsd(activity.summary.avgSuccessfulSearch)}
                </p>
                <p className="text-[13px] mt-2" style={{ color: "var(--ink-mute)" }}>
                  {formatUsd(activity.summary.failedCost)} spent on failures this month
                </p>
              </div>
            </div>

            <div className="card p-5 mb-6">
              <p className="eyebrow mb-4">Last 14 days</p>
              <DailyChart days={activity.summary.daily} />
            </div>

            <div className="card overflow-hidden">
              <div style={{ overflowX: "auto" }}>
                <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "480px" }}>
                  <caption className="sr-only">AI spend this month by who made the request</caption>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                      <Th>This month, by who</Th>
                      <Th align="right">Requests</Th>
                      <Th align="right">Failed</Th>
                      <Th align="right">Cost</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["anonymous", ...PLAN_ORDER] as string[]).map((plan) => {
                      const b = activity.summary.byPlan[plan] ?? { cost: 0, calls: 0, failed: 0 };
                      return (
                        <tr key={plan} style={{ borderBottom: "1px solid var(--rule)" }}>
                          <Td>{planLabel(plan)}</Td>
                          <Td align="right" mono>
                            {b.calls.toLocaleString()}
                          </Td>
                          <Td align="right" mono muted={b.failed === 0}>
                            {b.failed.toLocaleString()}
                          </Td>
                          <Td align="right" mono>
                            {formatUsd(b.cost)}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="panel p-6">
            <p className="text-[14px]" style={{ color: "var(--alert)" }}>
              Spend tracking isn&apos;t set up on this database yet.
            </p>
            <p className="text-[13.5px] mt-2" style={{ color: "var(--ink-soft)" }}>
              Run <code>npm run db:deploy</code> once to create the table it needs. Searches keep
              working in the meantime; they just aren&apos;t counted here.
            </p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------- Recent activity */}
      <section className="mb-14" aria-labelledby="activity-heading">
        <div className="flex items-baseline justify-between mb-4 gap-4">
          <h2 id="activity-heading" className="eyebrow">
            Latest AI requests
          </h2>
          <Link href="/admin/users" className="text-[13px]" style={{ color: "var(--accent)" }}>
            Manage users
          </Link>
        </div>

        {!activity || activity.recent.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-[14px]" style={{ color: "var(--ink-mute)" }}>
              No AI requests logged yet. They&apos;ll appear here as people search.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div style={{ overflowX: "auto" }}>
              <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "720px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    <Th>When (UTC)</Th>
                    <Th>Who</Th>
                    <Th>What</Th>
                    <Th align="right">Cost</Th>
                    <Th>Result</Th>
                  </tr>
                </thead>
                <tbody>
                  {activity.recent.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <Td muted mono>
                        {c.createdAt.toISOString().slice(5, 16).replace("T", " ")}
                      </Td>
                      <Td muted>{c.email ?? "Visitor"}</Td>
                      <Td>
                        <span style={{ color: "var(--ink-mute)" }}>
                          {c.kind === "chat" ? "Chat · " : ""}
                        </span>
                        {c.query || "—"}
                      </Td>
                      <Td align="right" mono>
                        {formatUsd(c.costUsd)}
                      </Td>
                      <Td>
                        {c.ok ? (
                          <span style={{ color: "var(--accent)" }}>Worked</span>
                        ) : (
                          <span style={{ color: "var(--alert)" }}>
                            Failed{c.errorDetail ? ` — ${c.errorDetail}` : ""}
                          </span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------- Accounts */}
      <section className="mb-12" aria-labelledby="accounts-heading">
        <h2 id="accounts-heading" className="eyebrow mb-4">
          Accounts and activity
        </h2>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}
        >
          <Stat label="Accounts" value={users} />
          <Stat label="Saved searches, all time" value={searchesTotal} />
          <Stat label="Saved searches, this month" value={searchesMonth} />
          <Stat label="Saved searches, last 24h" value={searches24h} />
          <Stat label="Saved listings" value={saved} />
          <Stat label="Tracked listings" value={tracked} />
        </div>
        <p className="text-[12.5px] mt-3" style={{ color: "var(--ink-mute)" }}>
          &ldquo;Saved searches&rdquo; are signed-in users&apos; history. Every search, including
          visitors&apos;, is counted under AI spend above.
        </p>
      </section>

      <section aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="eyebrow mb-4">
          Accounts by plan
        </h2>
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
    </main>
  );
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

type CheckStatus = "ok" | "warn" | "fail" | "off";
type Check = { label: string; status: CheckStatus; detail: string };

function healthChecks(activity: AiActivity | null, dbLatencyMs: number): Check[] {
  const checks: Check[] = [];

  const key = process.env.ANTHROPIC_API_KEY;
  if (isMockMode()) {
    checks.push({
      label: "AI search",
      status: "warn",
      detail: "Sample mode is on (VFM_MOCK_SEARCH=1) — searches return made-up data.",
    });
  } else if (!key || key.includes("REPLACE")) {
    checks.push({
      label: "AI search",
      status: "fail",
      detail: "ANTHROPIC_API_KEY isn't set, so every search fails.",
    });
  } else if (activity?.ongoingFailure) {
    checks.push({
      label: "AI search",
      status: "fail",
      detail: `Last request failed ${timeAgo(activity.ongoingFailure.at)}: ${activity.ongoingFailure.detail}`,
    });
  } else if (activity?.trackingSince) {
    checks.push({ label: "AI search", status: "ok", detail: "The most recent requests are working." });
  } else if (!activity) {
    checks.push({
      label: "AI search",
      status: "warn",
      detail: "Key is set. Recent requests can't be checked until spend tracking is set up — use the test button.",
    });
  } else {
    checks.push({
      label: "AI search",
      status: "warn",
      detail: "Key is set, but nothing has run yet. Use the test button to confirm it works.",
    });
  }

  checks.push({
    label: "Database",
    status: dbLatencyMs > 1500 ? "warn" : "ok",
    detail: `Connected — answered in ${dbLatencyMs} ms.`,
  });

  const secret = process.env.AUTH_SECRET || "";
  checks.push(
    secret.length >= 32
      ? { label: "Login sessions", status: "ok", detail: "AUTH_SECRET is set." }
      : {
          label: "Login sessions",
          status: secret ? "warn" : "fail",
          detail: secret
            ? "AUTH_SECRET is shorter than 32 characters — generate a longer one."
            : "AUTH_SECRET isn't set, so nobody can log in.",
        }
  );

  checks.push(
    isGoogleConfigured()
      ? { label: "Google sign-in", status: "ok", detail: "On — the Google button is showing." }
      : {
          label: "Google sign-in",
          status: "off",
          detail: "Off. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to switch it on (SETUP.md).",
        }
  );

  const adminEmails = configuredAdminEmails().size;
  checks.push({
    label: "Admin access",
    status: "ok",
    detail: adminEmails
      ? `${adminEmails} address${adminEmails === 1 ? "" : "es"} in ADMIN_EMAILS, plus anyone given the admin role.`
      : "Granted by the admin role only (ADMIN_EMAILS is empty).",
  });

  if (!activity) {
    checks.push({
      label: "Spend tracking",
      status: "fail",
      detail: "Its table is missing — run npm run db:deploy.",
    });
  }

  return checks;
}

function StatusDot({ status }: { status: CheckStatus }) {
  const color = {
    ok: "var(--accent)",
    warn: "var(--flag)",
    fail: "var(--alert)",
    off: "var(--rule-strong)",
  }[status];
  const label = { ok: "OK", warn: "Warning", fail: "Problem", off: "Off" }[status];
  return (
    <span
      role="img"
      aria-label={label}
      style={{ width: 9, height: 9, borderRadius: 999, background: color, flexShrink: 0 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Spend widgets
// ---------------------------------------------------------------------------

function SpendCard({ label, bucket }: { label: string; bucket: Bucket }) {
  return (
    <div className="card p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className="numeric" style={{ fontSize: "1.9rem", color: "var(--ink)" }}>
        {formatUsd(bucket.cost)}
      </p>
      <p className="text-[13px] mt-2" style={{ color: "var(--ink-mute)" }}>
        {bucket.calls.toLocaleString()} request{bucket.calls === 1 ? "" : "s"}
        {bucket.failed > 0 && (
          <>
            {" · "}
            <span style={{ color: "var(--alert)" }}>{bucket.failed.toLocaleString()} failed</span>
          </>
        )}
      </p>
    </div>
  );
}

/** Plain CSS bars — one series, fourteen points; a chart library would be overkill. */
function DailyChart({ days }: { days: DayBucket[] }) {
  const max = Math.max(...days.map((d) => d.cost), 0);
  const total = days.reduce((sum, d) => sum + d.cost, 0);

  if (total === 0) {
    return (
      <p className="text-[13.5px]" style={{ color: "var(--ink-mute)" }}>
        No spend in the last 14 days.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: 120 }}>
        {days.map((d) => {
          const pct = max > 0 ? (d.cost / max) * 100 : 0;
          const label = `${d.day}: ${formatUsd(d.cost)}, ${d.calls} request${d.calls === 1 ? "" : "s"}${d.failed ? `, ${d.failed} failed` : ""}`;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col justify-end h-full"
              title={label}
              aria-label={label}
              role="img"
            >
              <div
                style={{
                  height: d.cost > 0 ? `max(${pct}%, 3px)` : 0,
                  background: d.failed && d.failed === d.calls ? "var(--alert)" : "var(--accent)",
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        className="flex justify-between mt-2 text-[11.5px] numeric"
        style={{ color: "var(--ink-mute)", borderTop: "1px solid var(--rule)", paddingTop: 6 }}
      >
        <span>{days[0].day.slice(5)}</span>
        <span>Busiest day {formatUsd(max)}</span>
        <span>{days[days.length - 1].day.slice(5)}</span>
      </div>
    </div>
  );
}

function planLabel(plan: string): string {
  if (plan === "anonymous") return "Visitors (not logged in)";
  return plan in PLANS ? `${PLANS[plan as keyof typeof PLANS].name} accounts` : plan;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function timeAgo(d: Date): string {
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

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
    <th className="eyebrow" style={{ textAlign: align, padding: "11px 16px", fontWeight: 500 }}>
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
