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
import type { SearchResult, User, Listing } from "@/types";

type AppState = "home" | "loading" | "results" | "error";

function VFMApp() {
  const [state, setState] = useState<AppState>("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: string; query: string; listing: any }[]>([]);
  const [tracked, setTracked] = useState<{ id: string; query: string; listing: any }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  const savedIds = new Set(saved.map((s) => `${s.query}::${s.listing.store}`));
  const trackedIds = new Set(tracked.map((t) => `${t.query}::${t.listing.store}`));

  // Check current session on load (real cookie-based auth check)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  // Load saved/tracked/history when user logs in
  useEffect(() => {
    if (!user) {
      setSaved([]);
      setTracked([]);
      setHistory([]);
      return;
    }
    fetch("/api/saved")
      .then((r) => r.json())
      .then((d) => setSaved(d.saved || []))
      .catch(() => {});
    fetch("/api/tracked")
      .then((r) => r.json())
      .then((d) => setTracked(d.tracked || []))
      .catch(() => {});
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setHistory((d.history || []).map((h: any) => h.query)))
      .catch(() => {});
  }, [user]);

  const doSearch = useCallback(
    async (q: string, file?: File | null) => {
      const sq = (q || "").trim();
      const label = sq || (file ? `📸 ${file.name}` : "");
      if (!label) return;

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
            r.onload = () => res((r.result as string).split(",")[1]);
            r.onerror = () => rej(new Error("Could not read image file"));
            r.readAsDataURL(file);
          });
          imageMediaType = file.type;
        } catch {
          setError("Couldn't read the uploaded image. Please try a different file.");
          setState("error");
          return;
        }
      }

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: sq, imageBase64, imageMediaType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");

        setResults(data);
        setState("results");
        setHistory((h) => [label, ...h.filter((x) => x !== label)].slice(0, 15));
        push("Search complete");
        setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
      } catch (e: any) {
        setError(e.message || "Search failed. Please try again.");
        setState("error");
      }
    },
    [push]
  );

  const reset = useCallback(() => {
    setState("home");
    setQuery("");
    setResults(null);
    setError(null);
  }, []);

  const toggleSave = useCallback(
    async (id: string, listing: Listing) => {
      if (!user) {
        push("Log in to save products", "error");
        setShowAuth(true);
        return;
      }
      const existing = saved.find((s) => `${s.query}::${s.listing.store}` === id);
      if (existing) {
        await fetch("/api/saved", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: existing.id }) });
        setSaved((s) => s.filter((x) => x.id !== existing.id));
        push("Removed from saved");
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, listing }),
        });
        const data = await res.json();
        setSaved((s) => [...s, { id: data.id, query, listing }]);
        push("Saved product ♥");
      }
    },
    [user, saved, query, push]
  );

  const toggleTrack = useCallback(
    async (id: string, listing: Listing) => {
      if (!user) {
        push("Log in to track prices", "error");
        setShowAuth(true);
        return;
      }
      const existing = tracked.find((t) => `${t.query}::${t.listing.store}` === id);
      if (existing) {
        await fetch("/api/tracked", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: existing.id }) });
        setTracked((t) => t.filter((x) => x.id !== existing.id));
        push("Price tracking stopped");
      } else {
        const res = await fetch("/api/tracked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, listing }),
        });
        const data = await res.json();
        setTracked((t) => [...t, { id: data.id, query, listing }]);
        push(`Tracking price drops for ${listing.store} 🔔`);
      }
    },
    [user, tracked, query, push]
  );

  const removeSaved = useCallback(
    async (id: string) => {
      await fetch("/api/saved", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setSaved((s) => s.filter((x) => x.id !== id));
      push("Removed from saved");
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
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    push("Logged out");
  }, [push]);

  return (
    <div className="flex min-h-screen" style={{ background: "#07090a" }}>
      <Sidebar
        history={history}
        savedList={saved}
        onSelect={(q) => doSearch(q)}
        onNewSearch={reset}
        currentQuery={query}
        user={user}
        onShowAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onRemoveSaved={removeSaved}
      />

      <div ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: "100vh" }}>
        {state === "results" && (
          <div
            className="sticky top-0 z-[100] px-6 py-2.5 flex items-center justify-between gap-3"
            style={{ background: "rgba(7,9,10,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(45,190,95,0.09)" }}
          >
            <div className="text-xs overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "#8aaa8e" }}>
              <span style={{ color: "#2dbe5f" }}>✦</span> {query}
            </div>
            <TopSearchBar onSearch={doSearch} />
          </div>
        )}

        {state === "home" && <HomeHero onSearch={doSearch} />}
        {state === "loading" && (
          <div className="max-w-[960px] mx-auto px-4 py-8">
            <LoadingView query={query} />
          </div>
        )}
        {state === "error" && <ErrorView message={error || "Something went wrong."} onRetry={reset} />}
        {state === "results" && results && (
          <ResultsView data={results} query={query} onReset={reset} savedIds={savedIds} onToggleSave={toggleSave} trackedIds={trackedIds} onToggleTrack={toggleTrack} />
        )}
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
