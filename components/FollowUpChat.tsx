"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { apiFetch, errorMessage, ApiRequestError } from "@/lib/api-client";
import type { ChatMessage, SearchResult } from "@/types";

const QUICK = [
  "Which has fastest delivery?",
  "Is this seller trustworthy?",
  "Should I buy now or wait?",
  "Best for warranty support?",
];

export default function FollowUpChat({
  productContext,
  originalQuery,
  isLoggedIn,
  onRequireLogin,
}: {
  productContext: SearchResult;
  originalQuery: string;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
}) {
  const greeting: ChatMessage = {
    role: "assistant",
    text: `I found pricing for "${originalQuery}" across multiple sellers. Ask me anything — delivery speed, seller trust, whether it's worth buying, or which option to pick.`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<{ stop: () => void } | null>(null);

  const ids = useId();
  const inputId = `${ids}-input`;
  const logId = `${ids}-log`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Stop any in-flight speech recognition if the component goes away.
  useEffect(() => () => recogRef.current?.stop(), []);

  const send = useCallback(
    async (q?: string) => {
      const userMsg = (q || input).trim();
      if (!userMsg || loading) return;

      if (!isLoggedIn) {
        onRequireLogin();
        return;
      }

      setInput("");
      setErrMsg(null);
      const historySoFar = messages;
      setMessages((m) => [...m, { role: "user", text: userMsg }]);
      setLoading(true);

      try {
        const data = await apiFetch<{ reply: string }>("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            // The seeded greeting is dropped: the API requires the first turn to
            // be a user message, and sending it made every first question fail.
            history: historySoFar
              .filter((m, i) => !(i === 0 && m.role === "assistant"))
              .slice(-8)
              .map((m) => ({ role: m.role, content: m.text })),
            originalQuery,
            productContext,
            userMessage: userMsg,
          }),
        });
        setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) {
          onRequireLogin();
          // Roll back the optimistic user message — it was never sent.
          setMessages((m) => m.slice(0, -1));
          setInput(userMsg);
          return;
        }
        const msg = errorMessage(e, "Couldn't reach the AI. Please try again.");
        setErrMsg(msg);
        setMessages((m) => [...m, { role: "assistant", text: `Sorry — ${msg}` }]);
      } finally {
        setLoading(false);
      }
    },
    [input, messages, productContext, originalQuery, loading, isLoggedIn, onRequireLogin]
  );

  const toggleVoice = useCallback(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
          onend: () => void;
          onerror: () => void;
          start: () => void;
          stop: () => void;
        })
      | undefined;

    if (!SR) {
      setErrMsg("Voice input isn't supported in this browser. Try Chrome or Edge.");
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
    r.onresult = (e) =>
      setInput(
        Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>)
          .map((x) => x[0].transcript)
          .join("")
      );
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
    <section
      className="rounded-[18px] overflow-hidden"
      style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)" }}
      aria-labelledby={`${ids}-heading`}
    >
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid rgba(45,190,95,0.09)" }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: loading ? "#f59e0b" : "#2dbe5f",
            animation: loading ? "pulseRing 1.2s infinite" : "none",
          }}
          aria-hidden="true"
        />
        <h2 id={`${ids}-heading`} className="text-xs font-semibold" style={{ color: "#8aaa8e" }}>
          Ask VFM AI about these results
        </h2>
      </div>

      <div
        id={logId}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        className="max-h-[280px] overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            style={{ animation: i === messages.length - 1 ? "slideUp .3s ease" : "none" }}
          >
            <div
              className="max-w-[84%] px-[13px] py-[9px] text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{
                borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                background: m.role === "user" ? "linear-gradient(135deg,#2dbe5f22,#2dbe5f14)" : "#0f1410",
                border: `1px solid ${m.role === "user" ? "#2dbe5f30" : "rgba(45,190,95,0.09)"}`,
                color: "#ddeede",
              }}
            >
              <span className="sr-only">{m.role === "user" ? "You said: " : "VFM AI said: "}</span>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="px-3.5 py-2.5 flex gap-1 items-center rounded-[13px_13px_13px_3px]"
              style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)" }}
            >
              <span className="sr-only">VFM AI is typing…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ background: "#2dbe5f", animation: `blink 1s ${i * 0.18}s ease infinite` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {errMsg && (
        <div role="alert" className="px-3.5 pb-2 text-[11px]" style={{ color: "#fca5a5" }}>
          ⚠️ {errMsg}
        </div>
      )}

      {!isLoggedIn && (
        <div className="px-3.5 pb-2 text-[11px]" style={{ color: "#3d5542" }}>
          Log in to ask follow-up questions about these listings.
        </div>
      )}

      <div className="px-3.5 pb-2.5 flex gap-1.5 flex-wrap">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="rounded-full px-2.5 py-1 text-[10px] transition-all"
            style={{
              background: "rgba(45,190,95,0.05)",
              border: "1px solid rgba(45,190,95,0.09)",
              color: "#8aaa8e",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="px-3.5 py-2.5 flex gap-2"
        style={{ borderTop: "1px solid rgba(45,190,95,0.09)" }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask a question about these listings
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about delivery, compatibility, or which to choose…"
          autoComplete="off"
          className="flex-1 rounded-[10px] px-3 py-2.5 text-xs min-w-0"
          style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)", color: "#ddeede" }}
        />
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? "Stop voice input" : "Start voice input"}
          title="Voice input"
          className="rounded-[10px] px-2.5 py-2 text-[13px] flex-shrink-0"
          style={{
            background: voiceOn ? "#2dbe5f22" : "none",
            border: `1px solid ${voiceOn ? "#2dbe5f60" : "rgba(45,190,95,0.09)"}`,
            color: voiceOn ? "#2dbe5f" : "#3d5542",
            animation: voiceOn ? "pulseRing 1.2s infinite" : "none",
          }}
        >
          <span aria-hidden="true">🎙️</span>
        </button>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Send question"
          className="btn-jade px-3.5 py-2 rounded-[10px] flex-shrink-0"
        >
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </section>
  );
}
