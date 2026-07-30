"use client";

import { useState, useEffect } from "react";
import Reveal from "./Reveal";
import SellerCard from "./SellerCard";
import CompTable from "./CompTable";
import FollowUpChat from "./FollowUpChat";
import type { SearchResult, Listing } from "@/types";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function useTypewriter(text: string, speed = 9) {
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
   * `recommendation` is 1-based and may point at any listing — the premise of
   * the product is that the best value isn't always the cheapest. Falls back to
   * the first listing when the model omits it.
   */
  const recommendedIndex =
    typeof data.recommendation === "number" &&
    data.recommendation >= 1 &&
    data.recommendation <= listings.length
      ? data.recommendation - 1
      : 0;

  if (listings.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24">
        <p className="eyebrow mb-4">No result</p>
        <h1 className="display mb-3" style={{ fontSize: "2rem", color: "var(--ink)" }}>
          We couldn&apos;t find listings for that
        </h1>
        <p className="text-[15px] leading-relaxed max-w-prose mb-7" style={{ color: "var(--ink-soft)" }}>
          Nothing came back for &ldquo;{query}&rdquo;. A brand and model number usually works better
          than a general description.
        </p>
        <button onClick={onReset} className="btn">
          New search
        </button>
      </div>
    );
  }

  const pick = listings[recommendedIndex];

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pb-24 pt-8">
      <Reveal>
        <header className="flex items-start justify-between gap-6 flex-wrap mb-10">
          <div className="min-w-0">
            <p className="eyebrow mb-3">Comparison</p>
            <h1
              className="display break-words"
              style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.75rem)", color: "var(--ink)" }}
            >
              {query}
            </h1>
            {data.productSummary && (
              <p className="text-[14px] mt-3 max-w-prose" style={{ color: "var(--ink-soft)" }}>
                {data.productSummary}
              </p>
            )}
          </div>
          <button onClick={onReset} className="btn-quiet flex-shrink-0">
            New search
          </button>
        </header>
      </Reveal>

      <div className="grid gap-5 md:gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(288px,1fr))" }}>
        {listings.map((l, i) => {
          const id = `${query}::${l.store}`;
          return (
            <SellerCard
              key={`${l.store}-${i}`}
              listing={l}
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
        <Reveal delay={0.08}>
          <section className="panel mt-8 px-6 md:px-10 py-9 md:py-11">
            <div className="grid lg:grid-cols-12 gap-5 lg:gap-10">
              <div className="lg:col-span-3">
                <p className="eyebrow mb-2">The verdict</p>
                {pick && (
                  <p className="display" style={{ fontSize: "1.5rem", color: "var(--accent)" }}>
                    {pick.store}
                  </p>
                )}
              </div>
              <div className="lg:col-span-9">
                {/* Full text is in the DOM for assistive tech; the typewriter
                    only controls what is painted. */}
                <p
                  className="text-[16px] leading-relaxed max-w-prose"
                  style={{ color: "var(--ink)" }}
                  aria-label={data.verdict}
                >
                  <span aria-hidden="true">
                    {verdictOut}
                    {verdictOut.length < data.verdict.length && (
                      <span
                        className="inline-block w-[2px] h-4 ml-0.5 align-middle"
                        style={{ background: "var(--accent)", animation: "blink .8s step-end infinite" }}
                      />
                    )}
                  </span>
                </p>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <div className="mt-8">
          <button
            onClick={() => setShowTable((t) => !t)}
            aria-expanded={showTable}
            aria-controls="comparison-table"
            className="w-full flex items-center justify-between py-3.5 text-[13px]"
            style={{
              borderTop: "1px solid var(--rule)",
              borderBottom: showTable ? "none" : "1px solid var(--rule)",
              color: "var(--ink-soft)",
              background: "none",
            }}
          >
            <span>Compare every detail side by side</span>
            <span aria-hidden="true" style={{ color: "var(--ink-mute)" }}>
              {showTable ? "–" : "+"}
            </span>
          </button>
          {showTable && (
            <div id="comparison-table" className="pb-6" style={{ animation: "riseIn .3s ease both" }}>
              <CompTable listings={listings} recommendedIndex={recommendedIndex} />
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-10">
          <FollowUpChat
            productContext={data}
            originalQuery={query}
            isLoggedIn={isLoggedIn}
            onRequireLogin={onRequireLogin}
          />
        </div>
      </Reveal>
    </div>
  );
}
