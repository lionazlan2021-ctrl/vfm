"use client";

import { useState, useEffect, useRef } from "react";
import Reveal from "./Reveal";
import ImgThumb from "./ImgThumb";

const HERO_LINES = ["Value For Money.", "Price vs. Quality.", "Smart Buying.", "Real Savings."];
const TRUSTED = ["Amazon", "Best Buy", "Walmart", "Noon", "eBay", "B&H Photo", "Newegg", "AliExpress"];

export default function HomeHero({ onSearch }: { onSearch: (q: string, file?: File | null) => void }) {
  const [query, setQuery] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setLineIdx((i) => (i + 1) % HERO_LINES.length);
        setFade(true);
      }, 380);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const go = (q?: string, f?: File | null) => {
    const sq = q ?? query;
    if (!sq.trim() && !f && !imgFile) return;
    onSearch(sq, f || imgFile);
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice search isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (voiceOn) {
      recogRef.current?.stop();
      setVoiceOn(false);
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => setQuery(Array.from(e.results).map((x: any) => x[0].transcript).join(""));
    r.onend = () => setVoiceOn(false);
    r.onerror = () => setVoiceOn(false);
    r.start();
    recogRef.current = r;
    setVoiceOn(true);
  };

  return (
    <div className="max-w-[680px] mx-auto px-6 pt-16 pb-20">
      <Reveal>
        <div className="text-center mb-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-medium"
            style={{ background: "rgba(45,190,95,0.05)", border: "1px solid rgba(45,190,95,0.22)", color: "#2dbe5f" }}
          >
            ✦ Real-Time AI Price Search
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <h1
          className="text-center font-extrabold leading-[1.06] mb-3.5"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(2.2rem,5.5vw,3.8rem)", letterSpacing: "-0.03em" }}
        >
          Find the Best Price.
          <br />
          <span style={{ color: "#2dbe5f", opacity: fade ? 1 : 0, transition: "opacity .35s ease" }}>{HERO_LINES[lineIdx]}</span>
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="text-center text-sm leading-loose max-w-[440px] mx-auto mb-10" style={{ color: "#8aaa8e" }}>
          Search any product. VFM AI searches the live web for the same item across Amazon, Best Buy, Walmart, and more — ranked by real value.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <div
          className="flex items-center gap-2.5 rounded-[20px] py-[5px] pr-[5px] pl-[18px]"
          style={{
            background: "#111815",
            border: "1.5px solid rgba(45,190,95,0.09)",
            boxShadow: "0 0 60px rgba(45,190,95,0.05)",
            animation: "glowBreath 5s 2s ease-in-out infinite",
          }}
        >
          {imgFile ? <ImgThumb file={imgFile} onRemove={() => setImgFile(null)} /> : <span className="text-base flex-shrink-0">🔍</span>}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={imgFile ? "Add context (optional)…" : "e.g. iPhone 15 Pro 256GB, Sony WH-1000XM5…"}
            className="flex-1 bg-transparent border-none outline-none text-sm py-3 min-w-0"
            style={{ color: "#ddeede" }}
          />
          <button
            onClick={toggleVoice}
            title="Voice search"
            className="rounded-[10px] px-2.5 py-2 text-sm flex-shrink-0 transition-all"
            style={{
              background: voiceOn ? "#2dbe5f22" : "none",
              border: `1px solid ${voiceOn ? "#2dbe5f60" : "rgba(45,190,95,0.09)"}`,
              color: voiceOn ? "#2dbe5f" : "#3d5542",
              animation: voiceOn ? "pulseRing 1.2s infinite" : "none",
            }}
          >
            🎙️
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            title="Upload product image"
            className="rounded-[10px] px-2.5 py-2 text-sm flex-shrink-0"
            style={{ background: "none", border: "1px solid rgba(45,190,95,0.09)", color: "#3d5542" }}
          >
            📸
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImgFile(e.target.files?.[0] || null)} />
          <button onClick={() => go()} disabled={!query.trim() && !imgFile} className="btn-jade rounded-[14px] px-5.5 py-2.5">
            Compare ↗
          </button>
        </div>
        {imgFile && (
          <div className="text-center text-[11px] mt-2" style={{ color: "#2dbe5f" }}>
            📸 AI will identify this product and compare prices
          </div>
        )}
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-5 text-center">
          <div className="text-[10px] tracking-wider uppercase mb-2.5" style={{ color: "#3d5542" }}>
            Searches across
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {TRUSTED.map((s) => (
              <span key={s} className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: "rgba(45,190,95,0.05)", border: "1px solid rgba(45,190,95,0.09)", color: "#8aaa8e" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-3 mt-14" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        {[
          { icon: "🔍", title: "Live Web Search", desc: "Real Claude AI search across the open web, not cached data" },
          { icon: "📸", title: "Image Recognition", desc: "Upload a photo — AI identifies it and finds live prices" },
          { icon: "💬", title: "Conversational Memory", desc: "Follow-up questions stay in context for the whole session" },
          { icon: "💳", title: "Live Payment Plans", desc: "Real installment math from the actual listing price" },
        ].map((f, i) => (
          <Reveal key={f.title} delay={0.25 + i * 0.06}>
            <div className="card-hover rounded-[14px] p-4" style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)" }}>
              <div className="text-[22px] mb-2">{f.icon}</div>
              <div className="text-xs font-semibold mb-1" style={{ color: "#ddeede" }}>
                {f.title}
              </div>
              <div className="text-[11px] leading-relaxed" style={{ color: "#3d5542" }}>
                {f.desc}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
