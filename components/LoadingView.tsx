"use client";

import { useState, useEffect } from "react";

/** Describes what's genuinely happening, in order. */
const STEPS = [
  "Identifying the exact product",
  "Searching sellers for current listings",
  "Reading condition, shipping and warranty terms",
  "Weighing price against what you actually get",
];

function Bar({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return <div className="shimmer-bg rounded" style={{ width: w, height: h }} />;
}

export default function LoadingView({ query }: { query: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div className="mb-10">
        <p className="eyebrow mb-3">Comparing</p>
        <h1 className="display mb-6" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--ink)" }}>
          {query}
        </h1>

        <ol className="space-y-2.5" aria-live="polite">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex items-center gap-3 text-[13.5px]">
                <span
                  aria-hidden="true"
                  className="flex items-center justify-center flex-shrink-0 rounded-full"
                  style={{
                    width: 16,
                    height: 16,
                    border: `1.5px solid ${done || active ? "var(--accent)" : "var(--rule-strong)"}`,
                    background: done ? "var(--accent)" : "transparent",
                  }}
                >
                  {active && (
                    <span
                      className="rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: "var(--accent)",
                        animation: "blink 1.1s ease infinite",
                      }}
                    />
                  )}
                </span>
                <span style={{ color: done || active ? "var(--ink-soft)" : "var(--ink-mute)" }}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(288px,1fr))" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-6">
            <Bar w="45%" h={13} />
            <div className="mt-4">
              <Bar w="65%" h={30} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-6">
              {[0, 1, 2, 3].map((j) => (
                <div key={j}>
                  <Bar w="60%" h={9} />
                  <div className="mt-2">
                    <Bar w="85%" h={11} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Bar h={5} />
            </div>
            <div className="mt-5">
              <Bar h={40} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
