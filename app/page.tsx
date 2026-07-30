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
import type { SearchResult, User, Listing, HistoryEntry, SavedEntry } from "@/types";

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
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  const savedIds = new Set(saved.map((s) => entryKey(s.query, s.listing.store)));
  const trackedIds = new Set(tracked.map((t) => entryKey(t.query, t.listing.store)));

  // Restore the session on load.
  useEffect(() => {
    apiFetch<{ user: User | null }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

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
      const label = sq || (file ? `📸 ${file.name}` : "");
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
        push("Search complete");
        // Re-read history from the server so the sidebar shows the real row id,
        // which is what makes a past search reopenable without paying again.
        if (user) refreshHistory();
        scrollToTop();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) setShowAuth(true);
        setError(errorMessage(e, "Search failed. Please try again."));
        setState("error");
      }
    },
    [push, user, refreshHistory]
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
          push("Saved product ♥");
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
          push(`Tracking price drops for ${listing.store} 🔔`);
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
      push(`Welcome, ${u.name}!`);
    },
    [push]
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear locally regardless — the cookie may already be gone.
    }
    setUser(null);
    // Also drop on-screen results: they belong to the session that just ended.
    reset();
    push("Logged out");
  }, [push, reset]);

  return (
    <div className="flex min-h-screen" style={{ background: "#07090a" }}>
      {/* Dimmer behind the mobile drawer. */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[90] md:hidden"
          style={{ background: "rgba(0,0,0,.6)" }}
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
        authChecked={authChecked}
        onShowAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
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
          className="sticky top-0 z-[80] px-4 py-2.5 flex items-center gap-3 md:hidden"
          style={{
            background: "rgba(7,9,10,0.92)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(45,190,95,0.09)",
          }}
        >
          {/* 44px minimum so it is comfortably tappable on a phone. */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            className="text-lg leading-none flex items-center justify-center -ml-2"
            style={{
              color: "#2dbe5f",
              background: "none",
              border: "none",
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <span className="font-extrabold text-sm" style={{ color: "#ddeede" }}>
            VFM<span style={{ color: "#2dbe5f" }}>.com</span>
          </span>
        </div>

        {state === "results" && (
          <div
            className="sticky top-0 z-[70] px-4 md:px-6 py-2.5 flex items-center justify-between gap-3"
            style={{
              background: "rgba(7,9,10,0.9)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(45,190,95,0.09)",
            }}
          >
            <div
              className="text-xs overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block"
              style={{ color: "#8aaa8e" }}
            >
              <span style={{ color: "#2dbe5f" }}>✦</span> {query}
            </div>
            <TopSearchBar onSearch={doSearch} />
          </div>
        )}

        <main>
          {state === "home" && <HomeHero onSearch={doSearch} />}
          {state === "loading" && (
            <div className="max-w-[960px] mx-auto px-4 py-8">
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
