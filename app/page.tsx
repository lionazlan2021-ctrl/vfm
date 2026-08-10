"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import HomeHero from "@/components/HomeHero";
import LoadingView from "@/components/LoadingView";
import ErrorView from "@/components/ErrorView";
import ResultsView from "@/components/ResultsView";
import AuthModal from "@/components/AuthModal";
import TopSearchBar from "@/components/TopSearchBar";
import { ToastProvider, useToast } from "@/components/Toast";
import { apiFetch, apiSend, errorMessage, ApiRequestError } from "@/lib/api-client";
import type { SearchResult, User, Listing, HistoryEntry, SavedEntry, Usage } from "@/types";

type AppState = "home" | "loading" | "results" | "error";

/** Identifies a listing within a search. Must match the key used for saved/tracked lookups. */
const entryKey = (query: string, store: string) => `${query}::${store}`;

function VFMApp() {
  const [state, setState] = useState<AppState>("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [tracked, setTracked] = useState<SavedEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  const savedIds = new Set(saved.map((s) => entryKey(s.query, s.listing.store)));
  const trackedIds = new Set(tracked.map((t) => entryKey(t.query, t.listing.store)));

  /** Session plus this month's quota — one request, so they can't disagree. */
  const refreshSession = useCallback(() => {
    return apiFetch<{ user: User | null; usage?: Usage }>("/api/auth/me")
      .then((d) => {
        setUser(d.user);
        setUsage(d.usage ?? null);
      })
      .catch(() => {
        setUser(null);
        setUsage(null);
      });
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setAuthChecked(true));
  }, [refreshSession]);

  const refreshHistory = useCallback(() => {
    apiFetch<{ history: HistoryEntry[] }>("/api/history")
      .then((d) => setHistory(d.history || []))
      .catch(() => {});
  }, []);

  // Load the signed-in user's lists; clear them on sign-out.
  useEffect(() => {
    if (!user) {
      setSaved([]);
      setTracked([]);
      setHistory([]);
      return;
    }
    apiFetch<{ saved: SavedEntry[] }>("/api/saved")
      .then((d) => setSaved(d.saved || []))
      .catch(() => {});
    apiFetch<{ tracked: SavedEntry[] }>("/api/tracked")
      .then((d) => setTracked(d.tracked || []))
      .catch(() => {});
    refreshHistory();
  }, [user, refreshHistory]);

  const scrollToTop = () =>
    setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);

  const doSearch = useCallback(
    async (q: string, file?: File | null) => {
      const sq = (q || "").trim();
      const label = sq || (file ? `Photo: ${file.name}` : "");
      if (!label) return;

      setMobileNavOpen(false);
      setState("loading");
      setQuery(label);
      setResults(null);
      setError(null);

      let imageBase64: string | undefined;
      let imageMediaType: string | undefined;

      if (file) {
        try {
          imageBase64 = await new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => {
              const dataUrl = r.result as string;
              const comma = dataUrl.indexOf(",");
              if (comma === -1) rej(new Error("Could not read image file"));
              else res(dataUrl.slice(comma + 1));
            };
            r.onerror = () => rej(new Error("Could not read image file"));
            r.readAsDataURL(file);
          });
          imageMediaType = file.type;
        } catch {
          setError("Couldn't read that image. Try a different file.");
          setState("error");
          return;
        }
      }

      try {
        const data = await apiFetch<SearchResult>("/api/search", {
          method: "POST",
          body: JSON.stringify({ query: sq, imageBase64, imageMediaType }),
        });

        setResults(data);
        setState("results");
        // Re-read history from the server so the sidebar shows the real row id,
        // which is what makes a past search reopenable without paying again.
        // Usage is re-read too, since this search just consumed one.
        if (user) {
          refreshHistory();
          void refreshSession();
        }
        scrollToTop();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) setShowAuth(true);
        setError(errorMessage(e, "Search failed. Please try again."));
        setState("error");
      }
    },
    [user, refreshHistory, refreshSession]
  );

  /**
   * Reopens a past search from storage.
   *
   * The sidebar used to call `doSearch` with the old query text, which ran a
   * fresh paid Anthropic search every time you clicked your own history. The
   * result was already in the database; this reads it back.
   */
  const openHistoryEntry = useCallback(
    async (entry: HistoryEntry) => {
      setMobileNavOpen(false);
      setState("loading");
      setQuery(entry.query);
      setResults(null);
      setError(null);

      try {
        const data = await apiFetch<{ query: string; result: SearchResult }>(
          `/api/history/${encodeURIComponent(entry.id)}`
        );
        setResults(data.result);
        setQuery(data.query);
        setState("results");
        scrollToTop();
      } catch (e) {
        // The stored copy is gone or unreadable — fall back to a live search.
        if (e instanceof ApiRequestError && e.status === 404) {
          push("That saved result expired — searching again", "error");
          void doSearch(entry.query);
          return;
        }
        setError(errorMessage(e, "Couldn't reopen that search."));
        setState("error");
      }
    },
    [doSearch, push]
  );

  const reset = useCallback(() => {
    setState("home");
    setQuery("");
    setResults(null);
    setError(null);
    setMobileNavOpen(false);
  }, []);

  const requireLogin = useCallback(
    (message: string) => {
      push(message, "error");
      setShowAuth(true);
    },
    [push]
  );

  const toggleSave = useCallback(
    async (id: string, listing: Listing) => {
      if (!user) return requireLogin("Log in to save products");

      const existing = saved.find((s) => entryKey(s.query, s.listing.store) === id);
      try {
        if (existing) {
          await apiSend("/api/saved", "DELETE", { id: existing.id });
          setSaved((s) => s.filter((x) => x.id !== existing.id));
          push("Removed from saved");
        } else {
          const data = await apiSend<{ id: string }>("/api/saved", "POST", { query, listing });
          setSaved((s) => [
            ...s,
            {
              id: data.id,
              query,
              store: listing.store,
              price: listing.price,
              listing,
              createdAt: new Date().toISOString(),
            },
          ]);
          push("Saved");
        }
      } catch (e) {
        push(errorMessage(e, "Couldn't update your saved list."), "error");
      }
    },
    [user, saved, query, push, requireLogin]
  );

  const toggleTrack = useCallback(
    async (id: string, listing: Listing) => {
      if (!user) return requireLogin("Log in to track prices");

      const existing = tracked.find((t) => entryKey(t.query, t.listing.store) === id);
      try {
        if (existing) {
          await apiSend("/api/tracked", "DELETE", { id: existing.id });
          setTracked((t) => t.filter((x) => x.id !== existing.id));
          push("Price tracking stopped");
        } else {
          const data = await apiSend<{ id: string }>("/api/tracked", "POST", { query, listing });
          setTracked((t) => [
            ...t,
            {
              id: data.id,
              query,
              store: listing.store,
              price: listing.price,
              listing,
              createdAt: new Date().toISOString(),
            },
          ]);
          push(`Tracking the price at ${listing.store}`);
        }
      } catch (e) {
        push(errorMessage(e, "Couldn't update price tracking."), "error");
      }
    },
    [user, tracked, query, push, requireLogin]
  );

  const removeSaved = useCallback(
    async (id: string) => {
      try {
        await apiSend("/api/saved", "DELETE", { id });
        setSaved((s) => s.filter((x) => x.id !== id));
        push("Removed from saved");
      } catch (e) {
        push(errorMessage(e, "Couldn't remove that item."), "error");
      }
    },
    [push]
  );

  const handleAuth = useCallback(
    (u: User) => {
      setUser(u);
      setShowAuth(false);
      // Pull the plan and quota that belong to this account.
      void refreshSession();
      push(`Welcome, ${u.name}`);
    },
    [push, refreshSession]
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear locally regardless — the cookie may already be gone.
    }
    setUser(null);
    setUsage(null);
    // Also drop on-screen results: they belong to the session that just ended.
    reset();
    push("Logged out");
  }, [push, reset]);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Dimmer behind the mobile drawer. */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[90] md:hidden"
          style={{ background: "rgba(23,25,15,.36)" }}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        history={history}
        savedList={saved}
        onSelectHistory={openHistoryEntry}
        onSelectQuery={(q) => doSearch(q)}
        onNewSearch={reset}
        currentQuery={query}
        user={user}
        usage={usage}
        authChecked={authChecked}
        onShowAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onRemoveSaved={removeSaved}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-w-0"
        style={{ maxHeight: "100vh" }}
      >
        <div
          className="sticky top-0 z-[80] px-4 py-2 flex items-center gap-2 md:hidden"
          style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}
        >
          {/* 44px minimum so it is comfortably tappable on a phone. */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            className="flex items-center justify-center -ml-2"
            style={{ color: "var(--ink)", background: "none", border: "none", minWidth: 44, minHeight: 44 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="display text-[17px]" style={{ color: "var(--ink)" }}>
            VFM<span style={{ color: "var(--accent)" }}>.</span>
          </span>
        </div>

        {state === "results" && (
          <div
            className="sticky top-0 z-[70] px-4 md:px-8 py-2.5 flex items-center justify-end gap-3"
            style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}
          >
            <TopSearchBar onSearch={doSearch} />
          </div>
        )}

        <main>
          {state === "home" && <HomeHero onSearch={doSearch} />}
          {state === "loading" && (
            <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
              <LoadingView query={query} />
            </div>
          )}
          {state === "error" && (
            <ErrorView message={error || "Something went wrong."} onRetry={reset} />
          )}
          {state === "results" && results && (
            <ResultsView
              data={results}
              query={query}
              onReset={reset}
              savedIds={savedIds}
              onToggleSave={toggleSave}
              trackedIds={trackedIds}
              onToggleTrack={toggleTrack}
              isLoggedIn={Boolean(user)}
              onRequireLogin={() => requireLogin("Log in to ask follow-up questions")}
            />
          )}
        </main>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <VFMApp />
    </ToastProvider>
  );
}
