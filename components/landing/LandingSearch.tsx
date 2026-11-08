"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { useShortcuts } from "@/lib/use-shortcuts";

const EXAMPLES = ["AirPods Pro 2", "PS5 Slim", "Dyson V15 Detect", "Kindle Paperwhite"];

/**
 * The landing page's search box. Submitting hands the query to the app at
 * /app?q=…, which runs it once (see app/app/page.tsx). The chips only fill the
 * box: every search is a paid AI call, and a mis-tap shouldn't spend one.
 */
export default function LandingSearch({ id = "landing-search" }: { id?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useShortcuts([{ key: "/", handler: (e) => { e.preventDefault(); input.current?.focus(); } }]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      input.current?.focus();
      return;
    }
    haptic("tap");
    router.push(`/app?q=${encodeURIComponent(query.slice(0, 300))}`);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <label htmlFor={id} className="sr-only">
        Product to compare
      </label>
      <div
        className="flex items-center gap-2 p-2 rounded-2xl landing-search"
        style={{ background: "var(--paper)", border: "1px solid var(--rule-strong)" }}
      >
        <input
          id={id}
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name any product…"
          enterKeyHint="search"
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none text-[15px] px-3 py-2.5 min-w-0"
          style={{ color: "var(--ink)" }}
        />
        <button type="submit" className="btn" style={{ minHeight: 44 }}>
          Compare
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-[12.5px] mr-1" style={{ color: "var(--ink-mute)" }}>
          Try
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="chip"
            onClick={() => {
              haptic("tap");
              setQ(ex);
              input.current?.focus();
            }}
          >
            {ex}
          </button>
        ))}
      </div>
    </form>
  );
}
