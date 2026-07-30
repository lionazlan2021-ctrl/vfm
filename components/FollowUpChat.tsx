"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatTurn, SearchResult } from "@/types";

const QUICK = ["Which has fastest delivery?", "Is this seller trustworthy?", "Should I buy now or wait?", "Best for warranty support?"];

export default function FollowUpChat({ productContext, originalQuery }: { productContext: SearchResult; originalQuery: string }) {
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      text: `I found pricing for "${originalQuery}" across multiple sellers. Ask me anything — delivery speed, seller trust, whether it's worth buying, or which option to pick.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (q?: string) => {
      const userMsg = (q || input).trim();
      if (!userMsg || loading) return;
      setInput("");
      setErrMsg(null);
      const historySoFar = messages;
      setMessages((m) => [...m, { role: "user", text: userMsg }]);
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: historySoFar.slice(-8).map((m) => ({ role: m.role, content: m.text })),
            originalQuery,
            productContext,
            userMessage: userMsg,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      } catch (e: any) {
        setErrMsg(e.message || "Couldn't reach the AI. Please try again.");
        setMessages((m) => [...m, { role: "assistant", text: "Sorry — I hit an error reaching the AI service. Please try again in a moment." }]);
      } finally {
        setLoading(false);
      }
    },
    [input, messages, productContext, originalQuery, loading]
  );

  const toggleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErrMsg("Voice input isn't supported in this browser.");
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
    r.onresult = (e: any) => setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(""));
    r.onend = () => setVoiceOn(false);
    r.onerror = () => {
      setVoiceOn(false);
      setErrMsg("Voice input error — check microphone permissions.");
    };
    r.start();
    recogRef.current = r;
    setVoiceOn(true);
  }, [voiceOn]);

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)" }}>
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(45,190,95,0.09)" }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: loading ? "#f59e0b" : "#2dbe5f", animation: loading ? "pulseRing 1.2s infinite" : "none" }}
        />
        <span className="text-xs font-semibold" style={{ color: "#8aaa8e" }}>
          Ask VFM AI about these results
        </span>
      </div>

      <div className="max-h-[280px] overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} style={{ animation: i === messages.length - 1 ? "slideUp .3s ease" : "none" }}>
            <div
              className="max-w-[84%] px-[13px] py-[9px] text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{
                borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                background: m.role === "user" ? "linear-gradient(135deg,#2dbe5f22,#2dbe5f14)" : "#0f1410",
                border: `1px solid ${m.role === "user" ? "#2dbe5f30" : "rgba(45,190,95,0.09)"}`,
                color: "#ddeede",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 flex gap-1 items-center rounded-[13px_13px_13px_3px]" style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[5px] h-[5px] rounded-full" style={{ background: "#2dbe5f", animation: `blink 1s ${i * 0.18}s ease infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {errMsg && (
        <div className="px-3.5 pb-2 text-[11px]" style={{ color: "#fca5a5" }}>
          ⚠️ {errMsg}
        </div>
      )}

      <div className="px-3.5 pb-2.5 flex gap-1.5 flex-wrap">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="rounded-full px-2.5 py-1 text-[10px] transition-all"
            style={{ background: "rgba(45,190,95,0.05)", border: "1px solid rgba(45,190,95,0.09)", color: "#8aaa8e", opacity: loading ? 0.5 : 1 }}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="px-3.5 py-2.5 flex gap-2" style={{ borderTop: "1px solid rgba(45,190,95,0.09)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about delivery, compatibility, or which to choose…"
          className="flex-1 rounded-[10px] px-3 py-2.5 text-xs"
          style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)", color: "#ddeede" }}
        />
        <button
          onClick={toggleVoice}
          title="Voice input"
          className="rounded-[10px] px-2.5 py-2 text-[13px]"
          style={{
            background: voiceOn ? "#2dbe5f22" : "none",
            border: `1px solid ${voiceOn ? "#2dbe5f60" : "rgba(45,190,95,0.09)"}`,
            color: voiceOn ? "#2dbe5f" : "#3d5542",
            animation: voiceOn ? "pulseRing 1.2s infinite" : "none",
          }}
        >
          🎙️
        </button>
        <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-jade px-3.5 py-2 rounded-[10px]">
          ↑
        </button>
      </div>
    </div>
  );
}
