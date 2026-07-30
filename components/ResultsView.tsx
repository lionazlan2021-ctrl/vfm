"use client";

import { useState, useEffect } from "react";
import Reveal from "./Reveal";
import SellerCard from "./SellerCard";
import CompTable from "./CompTable";
import FollowUpChat from "./FollowUpChat";
import type { SearchResult, Listing } from "@/types";

function useTypewriter(text: string, speed = 11) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
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
}: {
  data: SearchResult;
  query: string;
  onReset: () => void;
  savedIds: Set<string>;
  onToggleSave: (id: string, listing: Listing) => void;
  trackedIds: Set<string>;
  onToggleTrack: (id: string, listing: Listing) => void;
}) {
  const [showTable, setShowTable] = useState(false);
  const verdictOut = useTypewriter(data.verdict || "");
  const listings = [data.listing1, data.listing2, data.listing3].filter(Boolean) as Listing[];

  return (
    <div className="max-w-[960px] mx-auto px-4 pb-24">
      <Reveal>
        <div className="flex items-center justify-between mb-5.5 flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-wider mb-0.5" style={{ color: "#3d5542", fontFamily: "JetBrains Mono, monospace" }}>
              PRICE COMPARISON
            </div>
            <div className="text-lg font-bold" style={{ color: "#ddeede" }}>
              "{query}"
            </div>
            {data.productSummary && (
              <div className="text-xs mt-0.5" style={{ color: "#8aaa8e" }}>
                {data.productSummary}
              </div>
            )}
          </div>
          <button onClick={onReset} className="btn-ghost">
            ← New Search
          </button>
        </div>
      </Reveal>

      <div className="grid gap-4.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))" }}>
        {listings.map((l, i) => {
          const id = `${query}::${l.store}`;
          return (
            <SellerCard
              key={i}
              listing={l}
              rank={i + 1}
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
            className="rounded-2xl px-5.5 py-4.5 mb-4"
            style={{ background: "linear-gradient(135deg,rgba(45,190,95,0.07),rgba(45,190,95,0.03))", border: "1px solid rgba(45,190,95,0.22)" }}
          >
            <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "#2dbe5f" }}>
              ✦ VFM VERDICT
            </div>
            <div className="text-sm leading-loose" style={{ color: "#ddeede" }}>
              {verdictOut}
              {verdictOut.length < (data.verdict || "").length && (
                <span
                  className="inline-block w-[2px] h-3.5 ml-0.5 align-middle"
                  style={{ background: "#2dbe5f", animation: "blink .8s step-end infinite" }}
                />
              )}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <button
          onClick={() => setShowTable((t) => !t)}
          className="w-full py-2.5 rounded-xl text-xs transition-all"
          style={{ background: "rgba(45,190,95,0.05)", border: "1px solid rgba(45,190,95,0.09)", color: "#3d5542", marginBottom: showTable ? 0 : 16 }}
        >
          {showTable ? "▲ Hide" : "▼ Show"} Full Comparison Table
        </button>
        {showTable && (
          <div className="rounded-[14px] p-4 mb-4" style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)", animation: "fadeUp .3s ease" }}>
            <CompTable listings={listings} />
          </div>
        )}
      </Reveal>

      <Reveal delay={0.2}>
        <FollowUpChat productContext={data} originalQuery={query} />
      </Reveal>
    </div>
  );
}
