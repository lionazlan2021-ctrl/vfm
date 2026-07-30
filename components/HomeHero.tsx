"use client";

import { useState, useRef } from "react";
import Reveal from "./Reveal";
import ImgThumb from "./ImgThumb";

/** Named because we actually search these — not decorative trust badges. */
const SELLERS = [
  "Amazon",
  "Best Buy",
  "Walmart",
  "Target",
  "Newegg",
  "B&H Photo",
  "eBay",
  "Noon",
  "AliExpress",
];

const HOW_IT_WORKS = [
  {
    step: "Step 1",
    title: "Name the product",
    body: "Type a model, or photograph the box. We identify the exact variant — size, capacity, colourway — before looking at a single price.",
  },
  {
    step: "Step 2",
    title: "We read the market",
    body: "A live web search pulls current listings from three different sellers, with their real condition, shipping cost, delivery window and warranty terms.",
  },
  {
    step: "Step 3",
    title: "We say which is worth it",
    body: "Each listing gets a value score out of ten and a stated reason. A cheap refurbished unit with a 90-day warranty does not beat a new one for the sake of being cheap.",
  },
];

export default function HomeHero({
  onSearch,
}: {
  onSearch: (q: string, file?: File | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [voiceOn, setVoiceOn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<{ stop: () => void } | null>(null);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !imgFile) return;
    onSearch(query, imgFile);
  };

  const toggleVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechLike;
      webkitSpeechRecognition?: new () => SpeechLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    if (voiceOn) {
      recogRef.current?.stop();
      setVoiceOn(false);
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) =>
      setQuery(Array.from(e.results).map((x) => x[0].transcript).join(""));
    r.onend = () => setVoiceOn(false);
    r.onerror = () => setVoiceOn(false);
    r.start();
    recogRef.current = r;
    setVoiceOn(true);
  };

  return (
    <div className="pb-24">
      {/* Hero — asymmetric, weighted left. The thesis is the sentence, not a slogan. */}
      <section className="px-5 md:px-10 lg:px-16 pt-14 md:pt-24">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-5">Value for money</p>
              {/* No hard line breaks — a fixed measure lets it wrap cleanly at
                  any width instead of breaking in the wrong place. */}
              <h1
                className="display"
                style={{
                  fontSize: "clamp(2.4rem, 5.6vw, 4.5rem)",
                  color: "var(--ink)",
                  maxWidth: "13ch",
                }}
              >
                The cheapest price is rarely the{" "}
                <span style={{ color: "var(--accent)" }}>best value.</span>
              </h1>
            </div>

            <div className="lg:col-span-5 lg:pb-3">
              <p
                className="text-[15px] leading-relaxed max-w-prose"
                style={{ color: "var(--ink-soft)" }}
              >
                Search any product and we compare the same item across three real
                sellers — weighing condition, seller trust, shipping, warranty and
                delivery against the asking price. Then we tell you which one
                actually deserves your money, and why.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Search — the primary action, given room to breathe. */}
        <Reveal delay={0.08}>
          <form onSubmit={submit} className="mt-11 max-w-3xl">
            <label htmlFor="hero-search" className="sr-only">
              Product to compare
            </label>
            <div
              className="flex items-center gap-2 p-2 rounded-2xl"
              style={{ background: "var(--paper)", border: "1px solid var(--rule-strong)" }}
            >
              {imgFile && <ImgThumb file={imgFile} onRemove={() => setImgFile(null)} />}
              <input
                id="hero-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  imgFile ? "Add any detail that narrows it down…" : "Sony WH-1000XM5, iPhone 15 Pro 256GB…"
                }
                className="flex-1 bg-transparent border-none outline-none text-[15px] px-3 py-2.5 min-w-0"
                style={{ color: "var(--ink)" }}
              />

              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? "Stop voice input" : "Search by voice"}
                className="btn-quiet"
                style={{
                  padding: "9px 12px",
                  minWidth: 44,
                  minHeight: 44,
                  borderColor: voiceOn ? "var(--accent)" : undefined,
                  color: voiceOn ? "var(--accent)" : undefined,
                }}
              >
                <MicIcon />
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Search by photo"
                className="btn-quiet"
                style={{ padding: "9px 12px", minWidth: 44, minHeight: 44 }}
              >
                <CameraIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => setImgFile(e.target.files?.[0] || null)}
              />

              <button
                type="submit"
                disabled={!query.trim() && !imgFile}
                className="btn"
                style={{ minHeight: 44 }}
              >
                Compare
              </button>
            </div>

            <p className="eyebrow mt-4">
              {imgFile ? "We'll identify the product from your photo" : `Searches ${SELLERS.length} sellers`}
            </p>
          </form>
        </Reveal>
      </section>

      {/* How it works — the reference's step rhythm: mono eyebrow, serif heading,
          short body, alternating alignment. */}
      <section className="mt-24 md:mt-32 px-5 md:px-10 lg:px-16">
        <div className="panel px-6 md:px-12 py-14 md:py-20">
          <div className="grid gap-14 md:gap-20">
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.step} delay={0.05 * i}>
                <div className="grid lg:grid-cols-12 gap-5 lg:gap-10">
                  <div className="lg:col-span-5">
                    <p className="eyebrow mb-4">{s.step}</p>
                    <h2
                      className="display"
                      style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", color: "var(--ink)" }}
                    >
                      {s.title}
                    </h2>
                  </div>
                  <div className="lg:col-span-6 lg:col-start-7">
                    <p
                      className="text-[15px] leading-relaxed max-w-prose"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      {s.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Where we look — plain text, not a badge wall. */}
      <section className="mt-20 px-5 md:px-10 lg:px-16">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-6 items-baseline">
            <p className="eyebrow lg:col-span-3">Sellers we search</p>
            <p
              className="lg:col-span-9 text-[15px] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              {SELLERS.join(" · ")}
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* Line icons rather than emoji — the design standards ban emoji as UI chrome. */

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

type SpeechLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};
