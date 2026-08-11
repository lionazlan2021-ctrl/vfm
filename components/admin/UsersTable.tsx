"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiSend, errorMessage } from "@/lib/api-client";
import { PLAN_ORDER, PLANS } from "@/lib/plans";

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  /** Admin via the ADMIN_EMAILS env var; the role dropdown can't revoke it. */
  isConfiguredAdmin: boolean;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  searchesTotal: number;
  searchesThisMonth: number;
  saved: number;
  tracked: number;
};

type Response = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pages: number;
};

export default function UsersTable({ currentAdminId }: { currentAdminId: string }) {
  const [data, setData] = useState<Response | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Ids currently being written, so their controls disable individually. */
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set("q", q.trim());
      setData(await apiFetch<Response>(`/api/admin/users?${params}`));
    } catch (e) {
      setError(errorMessage(e, "Couldn't load users."));
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => void load(query, page), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [query, page, load]);

  const update = async (id: string, patch: { plan?: string; role?: string }) => {
    setSaving((s) => new Set(s).add(id));
    setNotice(null);
    setError(null);

    // Optimistic: the control shows the new value immediately, and is put back
    // if the server rejects it.
    const previous = data;
    setData((d) =>
      d ? { ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) } : d
    );

    try {
      await apiSend(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", patch);
      setNotice("Saved.");
    } catch (e) {
      setData(previous);
      setError(errorMessage(e, "Couldn't save that change."));
    } finally {
      setSaving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <label htmlFor="admin-user-search" className="sr-only">
          Search users by name or email
        </label>
        <input
          id="admin-user-search"
          className="field"
          style={{ maxWidth: "320px" }}
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        {data && (
          <span className="eyebrow" style={{ color: "var(--ink-mute)" }}>
            {data.total} {data.total === 1 ? "account" : "accounts"}
          </span>
        )}
      </div>

      {error && (
        <p
          className="text-[13.5px] mb-4 px-4 py-3 rounded-lg"
          role="alert"
          style={{ background: "var(--flag-wash)", color: "var(--flag)" }}
        >
          {error}
        </p>
      )}
      {notice && !error && (
        <p
          className="text-[13.5px] mb-4 px-4 py-3 rounded-lg"
          role="status"
          style={{ background: "var(--accent-wash)", color: "var(--accent-deep)" }}
        >
          {notice}
        </p>
      )}

      {loading && !data ? (
        <div className="panel p-10 text-center">
          <p className="text-[14px]" style={{ color: "var(--ink-mute)" }}>
            Loading…
          </p>
        </div>
      ) : !data || data.users.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-[14px]" style={{ color: "var(--ink-mute)" }}>
            {query ? `No accounts match “${query}”.` : "No accounts yet."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div style={{ overflowX: "auto" }}>
            <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "860px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                  <Th>Account</Th>
                  <Th>Sign-in</Th>
                  <Th align="right">This month</Th>
                  <Th align="right">Total</Th>
                  <Th>Plan</Th>
                  <Th>Role</Th>
                  <Th align="right">Joined</Th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const busy = saving.has(u.id);
                  const isSelf = u.id === currentAdminId;
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <Td>
                        <span style={{ color: "var(--ink)" }}>{u.name}</span>
                        <br />
                        <span className="text-[12.5px]" style={{ color: "var(--ink-mute)" }}>
                          {u.email}
                        </span>
                      </Td>

                      <Td muted>
                        {[u.hasPassword && "Password", u.hasGoogle && "Google"]
                          .filter(Boolean)
                          .join(" + ") || "—"}
                      </Td>

                      <Td align="right" mono muted>
                        {u.searchesThisMonth}/{PLANS[u.plan as keyof typeof PLANS]?.searchesPerMonth ??
                          PLANS.free.searchesPerMonth}
                      </Td>
                      <Td align="right" mono muted>
                        {u.searchesTotal}
                      </Td>

                      <Td>
                        <label className="sr-only" htmlFor={`plan-${u.id}`}>
                          Plan for {u.email}
                        </label>
                        <select
                          id={`plan-${u.id}`}
                          className="field"
                          style={{ padding: "6px 10px", fontSize: "13px", width: "auto" }}
                          value={PLAN_ORDER.includes(u.plan as never) ? u.plan : "free"}
                          disabled={busy}
                          onChange={(e) => void update(u.id, { plan: e.target.value })}
                        >
                          {PLAN_ORDER.map((id) => (
                            <option key={id} value={id}>
                              {PLANS[id].name}
                            </option>
                          ))}
                        </select>
                      </Td>

                      <Td>
                        {u.isConfiguredAdmin ? (
                          // Their admin access comes from ADMIN_EMAILS, so this
                          // dropdown couldn't take it away. Say where it comes
                          // from instead of showing a control that does nothing.
                          <span
                            className="eyebrow"
                            style={{ color: "var(--accent-deep)" }}
                            title="Admin via the ADMIN_EMAILS environment variable. Remove them from it to revoke."
                          >
                            Admin (env)
                          </span>
                        ) : (
                          <>
                            <label className="sr-only" htmlFor={`role-${u.id}`}>
                              Role for {u.email}
                            </label>
                            <select
                              id={`role-${u.id}`}
                              className="field"
                              style={{ padding: "6px 10px", fontSize: "13px", width: "auto" }}
                              value={u.role === "admin" ? "admin" : "user"}
                              // Self-demotion is blocked on the server too; this
                              // just avoids offering an action that will fail.
                              disabled={busy || isSelf}
                              title={isSelf ? "You can't change your own role." : undefined}
                              onChange={(e) => void update(u.id, { role: e.target.value })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </>
                        )}
                      </Td>

                      <Td align="right" mono muted>
                        {u.createdAt.slice(0, 10)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-5 gap-4">
          <button
            className="btn-quiet"
            style={{ padding: "8px 14px" }}
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="eyebrow" style={{ color: "var(--ink-mute)" }}>
            Page {data.page} of {data.pages}
          </span>
          <button
            className="btn-quiet"
            style={{ padding: "8px 14px" }}
            disabled={page >= data.pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
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
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}
