"use client";

import { useState } from "react";
import type { User, HistoryEntry, SavedEntry } from "@/types";

const CATEGORIES: [string, string][] = [
  ["💻", "Electronics"],
  ["🎮", "Gaming"],
  ["👟", "Fashion"],
  ["🏃", "Fitness"],
  ["🏠", "Home"],
  ["🚗", "Cars"],
  ["📎", "Office"],
];

export default function Sidebar({
  history,
  savedList,
  onSelectHistory,
  onSelectQuery,
  onNewSearch,
  currentQuery,
  user,
  authChecked,
  onLogout,
  onShowAuth,
  collapsed,
  setCollapsed,
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
  authChecked: boolean;
  onLogout: () => void;
  onShowAuth: () => void;
  collapsed: boolean;
  setCollapsed: (fn: (c: boolean) => boolean) => void;
  onRemoveSaved: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [tab, setTab] = useState<"history" | "saved">("history");

  // Collapsing is a desktop affordance; on mobile the whole panel slides away.
  const width = collapsed ? 52 : 240;

  return (
    <nav
      aria-label="Search history and saved products"
      className={`flex flex-col flex-shrink-0 h-screen overflow-hidden transition-transform duration-200
        fixed inset-y-0 left-0 z-[95] md:sticky md:top-0 md:z-auto md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      style={{
        width,
        background: "#090d0a",
        borderRight: "1px solid rgba(45,190,95,0.09)",
      }}
    >
      <div
        className="px-3 py-3.5 flex items-center gap-2"
        style={{
          borderBottom: "1px solid rgba(45,190,95,0.09)",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2dbe5f,#1d9648)", color: "#000" }}
              aria-hidden="true"
            >
              V
            </div>
            <span
              className="font-extrabold text-sm whitespace-nowrap"
              style={{ color: "#ddeede", letterSpacing: "-0.02em" }}
            >
              VFM<span style={{ color: "#2dbe5f" }}>.com</span>
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-sm rounded p-0.5 hidden md:block"
          style={{ color: "#3d5542", background: "none", border: "none" }}
        >
          {collapsed ? "→" : "←"}
        </button>
        <button
          onClick={onCloseMobile}
          aria-label="Close menu"
          className="text-sm rounded md:hidden flex items-center justify-center -mr-2"
          style={{
            color: "#3d5542",
            background: "none",
            border: "none",
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="px-2 py-2.5">
        <button
          onClick={onNewSearch}
          className="w-full rounded-[10px] flex items-center gap-1.5 text-xs font-semibold"
          style={{
            background: collapsed ? "none" : "rgba(45,190,95,0.11)",
            border: `1px solid ${collapsed ? "rgba(45,190,95,0.09)" : "rgba(45,190,95,0.28)"}`,
            padding: collapsed ? "8px" : "8px 10px",
            color: "#2dbe5f",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <span aria-hidden="true">✦</span>
          {collapsed ? <span className="sr-only">New search</span> : <span>New Search</span>}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="flex gap-1 px-2 pb-2" role="tablist" aria-label="Sidebar sections">
            {(["history", "saved"] as const).map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className="flex-1 text-[10.5px] py-1.5 rounded-md transition-all"
                style={{
                  background: tab === id ? "rgba(45,190,95,0.11)" : "transparent",
                  color: tab === id ? "#2dbe5f" : "#3d5542",
                  border: "none",
                }}
              >
                {id === "history" ? "🕐 History" : "♡ Saved"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {tab === "history" && (
              <>
                {!authChecked ? (
                  <div className="text-[11px] px-1.5 py-2.5" style={{ color: "#3d5542" }}>
                    Loading…
                  </div>
                ) : !user ? (
                  <div className="text-[11px] px-1.5 py-2.5 leading-relaxed" style={{ color: "#3d5542" }}>
                    Log in to keep your search history.
                  </div>
                ) : history.length > 0 ? (
                  history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => onSelectHistory(h)}
                      title={`Reopen "${h.query}"`}
                      className={`sidebar-link ${currentQuery === h.query ? "active" : ""}`}
                    >
                      <span className="text-[11px] flex-shrink-0" aria-hidden="true">
                        🕐
                      </span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
                        {h.query}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-[11px] px-1.5 py-2.5" style={{ color: "#3d5542" }}>
                    No searches yet. Try one!
                  </div>
                )}
              </>
            )}

            {tab === "saved" && (
              <>
                {!authChecked ? (
                  <div className="text-[11px] px-1.5 py-2.5" style={{ color: "#3d5542" }}>
                    Loading…
                  </div>
                ) : !user ? (
                  <div className="text-[11px] px-1.5 py-2.5 leading-relaxed" style={{ color: "#3d5542" }}>
                    Log in to save products.
                  </div>
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
                          className="sidebar-link flex-1"
                          title={`${s.query} — open on ${s.listing.store}`}
                        >
                          <span className="text-[11px] flex-shrink-0" aria-hidden="true">
                            ♥
                          </span>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                            {s.listing.store} — {s.listing.price}
                          </span>
                        </a>
                      ) : (
                        <button
                          onClick={() => onSelectQuery(s.query)}
                          className="sidebar-link flex-1"
                          title={`${s.query} — search again (no saved link)`}
                        >
                          <span className="text-[11px] flex-shrink-0" aria-hidden="true">
                            ♥
                          </span>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
                            {s.listing.store} — {s.listing.price}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveSaved(s.id)}
                        aria-label={`Remove ${s.listing.store} listing from saved`}
                        className="text-[11px] px-1.5 py-1"
                        style={{ color: "#3d5542", background: "none", border: "none" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] px-1.5 py-2.5" style={{ color: "#3d5542" }}>
                    No saved products yet.
                  </div>
                )}
              </>
            )}

            <div
              className="text-[9px] tracking-wider uppercase px-1 pt-3.5 pb-1.5"
              style={{ color: "#3d5542" }}
            >
              Categories
            </div>
            {CATEGORIES.map(([icon, label]) => (
              <button
                key={label}
                onClick={() => onSelectQuery(`Best ${label} deals`)}
                className="sidebar-link"
              >
                <span className="text-sm flex-shrink-0" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {!collapsed && (
        <div className="px-2 py-2.5" style={{ borderTop: "1px solid rgba(45,190,95,0.09)" }}>
          {user ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: "rgba(45,190,95,0.11)", color: "#2dbe5f" }}
                  aria-hidden="true"
                >
                  {user.name[0]?.toUpperCase() || "?"}
                </div>
                <span
                  className="text-[11.5px] overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ color: "#8aaa8e" }}
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>
              <button onClick={onLogout} className="sidebar-link">
                <span aria-hidden="true">🚪</span>
                <span>Log out</span>
              </button>
            </>
          ) : (
            <button onClick={onShowAuth} className="sidebar-link">
              <span aria-hidden="true">👤</span>
              <span>Log in / Sign up</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
