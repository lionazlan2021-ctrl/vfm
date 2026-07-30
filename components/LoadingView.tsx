"use client";

import { useState, useEffect } from "react";

const LOAD_STEPS = [
  "Scanning trusted sellers worldwide…",
  "Fetching live pricing data…",
  "Verifying seller authenticity…",
  "Calculating value scores…",
  "Preparing your comparison…",
];

function Sk({ w = "100%", h = 13, r = 6, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) {
  return <div className="shimmer-bg" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />;
}

export default function LoadingView({ query }: { query: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % LOAD_STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ animation: "fadeIn .4s ease" }}>
      <div className="text-center py-8">
        <div
          className="w-[42px] h-[42px] rounded-full mx-auto mb-3.5"
          style={{ border: "2px solid #2dbe5f", borderTopColor: "transparent", animation: "spin .9s linear infinite" }}
        />
        <div className="text-[13px] mb-1.5" style={{ color: "#2dbe5f", fontFamily: "JetBrains Mono, monospace" }}>
          {LOAD_STEPS[step]}
        </div>
        <div className="text-[11px]" style={{ color: "#3d5542" }}>
          &ldquo;{query}&rdquo;
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {LOAD_STEPS.map((_, i) => (
            <div key={i} className="w-[5px] h-[5px] rounded-full transition-colors" style={{ background: i === step ? "#2dbe5f" : "#3d5542" }} />
          ))}
        </div>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[18px] p-5" style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)" }}>
            <div className="flex gap-3 mb-3.5">
              <Sk w={64} h={64} r={12} />
              <div className="flex-1">
                <Sk w="50%" h={10} mb={8} />
                <Sk w="70%" h={20} mb={4} />
                <Sk w="40%" h={9} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {[0, 1, 2, 3].map((j) => (
                <Sk key={j} h={42} r={8} />
              ))}
            </div>
            <Sk h={10} mb={4} />
            <Sk w="85%" h={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
