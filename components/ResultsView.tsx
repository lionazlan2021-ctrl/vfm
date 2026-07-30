"use client";

import { useState, useEffect } from "react";
import Reveal from "./Reveal";
import SellerCard from "./SellerCard";
import CompTable from "./CompTable";
import FollowUpChat from "./FollowUpChat";
import type { SearchResult, Listing } from "@/types";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function useTypewriter(text: string, speed = 11) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!text) {
      setOut("");
      return;
    }
    // Don't animate text for people who asked for less motion — show it at once.
    if (prefersReducedMotion()) {
      setOut(text);
      return;
    }

    setOut("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return out;
}

export default function ResultsView({
  data,
  query,
  onReset,
  savedIds,
  onToggleSave,
  trackedIds,
  onToggleTrack,
  isLoggedIn,
  onRequireLogin,
}: {
  data: SearchResult;
  query: string;
  onReset: () => void;
  savedIds: Set<string>;
  onToggleSave: (id: string, listing: Listing) => void;
  trackedIds: Set<string>;
  onToggleTrack: (id: string, listing: Listing) => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
}) {
  const [showTable, setShowTable] = useState(false);
  const verdictOut = useTypewriter(data.verdict || "");

  const listings = [data.listing1, data.listing2, data.listing3].filter(Boolean) as Listing[];

  /**
   * `recommendation` is 1-based and may point at any of the three listings —
   * the whole premise of the product is that the best value isn't always the
   * cheapest. It was previously ignored, and the badge was hardcoded to the
   * first card. Falls back to the first listing when the model omits it.
   */
  const recommendedIndex =
    typeof data.recommendation === "number" &&
    data.recommendation >= 1 &&
    data.recommendation <= listings.length
      ? data.recommendation - 1
      : 0;

  if (listings.length === 0) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-20 text-center">
        <div className="text-[40px] mb-3.5" aria-hidden="true">
          🔍
        </div>
        <div className="font-semibold mb-1.5" style={{ color: "#ddeede" }}>
          No listings found
        </div>
        <p className="text-[13px] mb-5.5 max-w-[380px] mx-auto" style={{ color: "#3d5542" }}>
          The search didn&apos;t turn up listings for &ldquo;{query}&rdquo;. Try a more specific
          product name, like a brand and model number.
        </p>
        <button onClick={onReset} className="btn-jade">
          New Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 pb-24">
      <Reveal>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3 pt-4">
          <div className="min-w-0">
            <div
              className="text-[10px] tracking-wider mb-0.5"
              style={{ color: "#3d5542", fontFamily: "JetBrains Mono, monospace" }}
            >
              PRICE COMPARISON
            </div>
            <h1 className="text-lg font-bold break-words" style={{ color: "#ddeede" }}>
              &ldquo;{query}&rdquo;
            </h1>
            {data.productSummary && (
              <p className="text-xs mt-0.5" style={{ color: "#8aaa8e" }}>
                {data.productSummary}
              </p>
            )}
          </div>
          <button onClick={onReset} className="btn-ghost flex-shrink-0">
            ← New Search
          </button>
        </div>
      </Reveal>

      <div
        className="grid gap-4 mb-5"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))" }}
      >
        {listings.map((l, i) => {
          const id = `${query}::${l.store}`;
          return (
            <SellerCard
              key={`${l.store}-${i}`}
              listing={l}
              rank={i + 1}
              isRecommended={i === recommendedIndex}
              isSaved={savedIds.has(id)}
              onSave={() => onToggleSave(id, l)}
              isTracked={trackedIds.has(id)}
              onTrack={() => onToggleTrack(id, l)}
            />
          );
        })}
      </div>

      {data.verdict && (
        <Reveal delay={0.1}>
          <div
            className="rounded-2xl px-5 py-4 mb-4"
            style={{
              background: "linear-gradient(135deg,rgba(45,190,95,0.07),rgba(45,190,95,0.03))",
              border: "1px solid rgba(45,190,95,0.22)",
            }}
          >
            <h2 className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "#2dbe5f" }}>
              ✦ VFM VERDICT
            </h2>
            {/* The full verdict is in the DOM from the start for assistive tech;
                the typewriter only controls what is painted. */}
            <p className="text-sm leading-loose" style={{ color: "#ddeede" }} aria-label={data.verdict}>
              <span aria-hidden="true">
                {verdictOut}
                {verdictOut.length < data.verdict.length && (
                  <span
                    className="inline-block w-[2px] h-3.5 ml-0.5 align-middle"
                    style={{ background: "#2dbe5f", animation: "blink .8s step-end infinite" }}
                  />
                )}
              </span>
            </p>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <button
          onClick={() => setShowTable((t) => !t)}
          aria-expanded={showTable}
          aria-controls="comparison-table"
          className="w-full py-2.5 rounded-xl text-xs transition-all"
          style={{
            background: "rgba(45,190,95,0.05)",
            border: "1px solid rgba(45,190,95,0.09)",
            color: "#3d5542",
            marginBottom: showTable ? 0 : 16,
          }}
        >
          {showTable ? "▲ Hide" : "▼ Show"} Full Comparison Table
        </button>
        {showTable && (
          <div
            id="comparison-table"
            className="rounded-[14px] p-4 mb-4"
            style={{
              background: "#111815",
              border: "1px solid rgba(45,190,95,0.09)",
              animation: "fadeUp .3s ease",
            }}
          >
            <CompTable listings={listings} recommendedIndex={recommendedIndex} />
          </div>
        )}
      </Reveal>

      <Reveal delay={0.2}>
        <FollowUpChat
          productContext={data}
          originalQuery={query}
          isLoggedIn={isLoggedIn}
          onRequireLogin={onRequireLogin}
        />
      </Reveal>
    </div>
  );
}
