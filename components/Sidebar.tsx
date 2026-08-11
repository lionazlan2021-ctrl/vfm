"use client";

import { useState } from "react";
import Link from "next/link";
import type { User, HistoryEntry, SavedEntry, Usage } from "@/types";

const CATEGORIES = ["Electronics", "Gaming", "Fashion", "Fitness", "Home", "Office"];

export default function Sidebar({
  history,
  savedList,
  onSelectHistory,
  onSelectQuery,
  onNewSearch,
  currentQuery,
  user,
  usage,
  authChecked,
  onLogout,
  onShowAuth,
  onRemoveSaved,
  mobileOpen,
  onCloseMobile,
}: {
  history: HistoryEntry[];
  savedList: SavedEntry[];
  /** Reopens a stored result — no new AI call. */
  onSelectHistory: (entry: HistoryEntry) => void;
  /** Runs a fresh (paid) search. */
  onSelectQuery: (q: string) => void;
  onNewSearch: () => void;
  currentQuery: string;
  user: User | null;
  usage: Usage | null;
  authChecked: boolean;
  onLogout: () => void;
  onShowAuth: () => void;
  onRemoveSaved: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [tab, setTab] = useState<"history" | "saved">("history");

  const quotaPct = usage && usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const quotaTight = usage ? usage.remaining <= Math.max(1, usage.limit * 0.1) : false;

  return (
    <nav
      aria-label="Search history and saved products"
      className={`flex flex-col flex-shrink-0 h-screen w-[264px] overflow-hidden transition-transform duration-200
        fixed inset-y-0 left-0 z-[95] md:sticky md:top-0 md:z-auto md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      style={{ background: "var(--paper-deep)", borderRight: "1px solid var(--rule)" }}
    >
      <div
        className="px-4 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <Link href="/" className="display text-[19px]" style={{ color: "var(--ink)" }}>
          VFM<span style={{ color: "var(--accent)" }}>.</span>
        </Link>
        <button
          onClick={onCloseMobile}
          aria-label="Close menu"
          className="md:hidden flex items-center justify-center -mr-2"
          style={{ minWidth: 44, minHeight: 44, background: "none", border: "none", color: "var(--ink-mute)" }}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-3 py-3">
        <button onClick={onNewSearch} className="btn w-full" style={{ minHeight: 40 }}>
          New search
        </button>
      </div>

      <div className="flex gap-1 px-3 pb-2" role="tablist" aria-label="Sidebar sections">
        {(["history", "saved"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="flex-1 eyebrow py-2 rounded-md transition-colors"
            style={{
              fontSize: 10,
              background: tab === id ? "var(--accent-wash)" : "transparent",
              color: tab === id ? "var(--accent-deep)" : "var(--ink-mute)",
              border: "none",
            }}
          >
            {id === "history" ? "History" : "Saved"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {tab === "history" && (
          <>
            {!authChecked ? (
              <p className="text-[12.5px] px-2 py-2" style={{ color: "var(--ink-mute)" }}>
                Loading…
              </p>
            ) : !user ? (
              <p className="text-[12.5px] px-2 py-2 leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                Log in to keep your search history.
              </p>
            ) : history.length > 0 ? (
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onSelectHistory(h)}
                  title={`Reopen "${h.query}"`}
                  className={`nav-link ${currentQuery === h.query ? "active" : ""}`}
                >
                  {h.query}
                </button>
              ))
            ) : (
              <p className="text-[12.5px] px-2 py-2" style={{ color: "var(--ink-mute)" }}>
                No searches yet.
              </p>
            )}
          </>
        )}

        {tab === "saved" && (
          <>
            {!authChecked ? (
              <p className="text-[12.5px] px-2 py-2" style={{ color: "var(--ink-mute)" }}>
                Loading…
              </p>
            ) : !user ? (
              <p className="text-[12.5px] px-2 py-2 leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                Log in to save products.
              </p>
            ) : savedList.length > 0 ? (
              savedList.map((s) => (
                <div key={s.id} className="flex items-center gap-1">
                  {/* Opens the actual listing rather than re-running a paid
                      search, which is what a saved item is for. */}
                  {s.listing.buyUrl ? (
                    <a
                      href={s.listing.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link flex-1"
                      title={`${s.query} — open at ${s.listing.store}`}
                    >
                      <span className="truncate">
                        {s.listing.store} · {s.listing.price}
                      </span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onSelectQuery(s.query)}
                      className="nav-link flex-1"
                      title={`${s.query} — search again (no saved link)`}
                    >
                      <span className="truncate">
                        {s.listing.store} · {s.listing.price}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveSaved(s.id)}
                    aria-label={`Remove ${s.listing.store} listing from saved`}
                    className="px-2 py-1 flex-shrink-0"
                    style={{ color: "var(--ink-mute)", background: "none", border: "none" }}
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-[12.5px] px-2 py-2" style={{ color: "var(--ink-mute)" }}>
                Nothing saved yet.
              </p>
            )}
          </>
        )}

        <p className="eyebrow px-2 pt-6 pb-2" style={{ fontSize: 10 }}>
          Browse
        </p>
        {CATEGORIES.map((label) => (
          <button key={label} onClick={() => onSelectQuery(`Best ${label} deals`)} className="nav-link">
            {label}
          </button>
        ))}
      </div>

      <div className="px-3 py-3" style={{ borderTop: "1px solid var(--rule)" }}>
        {user ? (
          <>
            {usage && (
              <div className="px-2 pb-3">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="eyebrow" style={{ fontSize: 10 }}>
                    {usage.planName} plan
                  </span>
                  <span
                    className="numeric text-[11px]"
                    style={{ color: quotaTight ? "var(--flag)" : "var(--ink-mute)" }}
                  >
                    {usage.used}/{usage.limit}
                  </span>
                </div>
                <div
                  className="h-[4px] rounded-full overflow-hidden"
                  style={{ background: "var(--panel-alt)" }}
                  role="meter"
                  aria-label="Searches used this month"
                  aria-valuenow={usage.used}
                  aria-valuemin={0}
                  aria-valuemax={usage.limit}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${quotaPct}%`,
                      background: quotaTight ? "var(--flag)" : "var(--accent)",
                    }}
                  />
                </div>
                <Link
                  href="/pricing"
                  className="inline-block mt-2.5 text-[12px] underline"
                  style={{ color: "var(--accent)" }}
                >
                  {user.plan === "premium" ? "View plans" : "Upgrade plan"}
                </Link>
              </div>
            )}

            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <div
                className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                style={{ background: "var(--accent-wash)", color: "var(--accent-deep)" }}
                aria-hidden="true"
              >
                {user.name[0]?.toUpperCase() || "?"}
              </div>
              <span
                className="text-[12.5px] truncate"
                style={{ color: "var(--ink-soft)" }}
                title={user.email}
              >
                {user.email}
              </span>
            </div>
            {user.isAdmin && (
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            )}
            <button onClick={onLogout} className="nav-link">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/pricing" className="nav-link">
              Plans and pricing
            </Link>
            <button onClick={onShowAuth} className="nav-link">
              Log in or sign up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function CloseIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
