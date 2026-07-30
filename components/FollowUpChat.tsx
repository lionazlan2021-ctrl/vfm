"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { apiFetch, errorMessage, ApiRequestError } from "@/lib/api-client";
import type { ChatMessage, SearchResult } from "@/types";

const QUICK = [
  "Which arrives soonest?",
  "Is the refurbished one worth the risk?",
  "Should I wait for a sale?",
  "Which has the best returns policy?",
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
    text: `Ask me anything about these three listings — delivery, seller trust, warranty terms, or which one to pick for ${originalQuery}.`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ids = useId();
  const inputId = `${ids}-input`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

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
        setMessages((m) => [...m, { role: "assistant", text: msg }]);
      } finally {
        setLoading(false);
      }
    },
    [input, messages, productContext, originalQuery, loading, isLoggedIn, onRequireLogin]
  );

  return (
    <section aria-labelledby={`${ids}-heading`}>
      <div className="grid lg:grid-cols-12 gap-5 lg:gap-10">
        <div className="lg:col-span-3">
          <p className="eyebrow mb-2">Still deciding</p>
          <h2 id={`${ids}-heading`} className="display text-[1.4rem]" style={{ color: "var(--ink)" }}>
            Ask a follow-up
          </h2>
        </div>

        <div className="lg:col-span-9">
          <div
            className="rounded-[var(--radius-card)] overflow-hidden"
            style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
          >
            <div
              role="log"
              aria-live="polite"
              className="max-h-[300px] overflow-y-auto px-4 py-4 flex flex-col gap-3"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[86%] px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap rounded-xl"
                    style={{
                      background: m.role === "user" ? "var(--accent-wash)" : "var(--panel)",
                      color: m.role === "user" ? "var(--accent-deep)" : "var(--ink-soft)",
                    }}
                  >
                    <span className="sr-only">{m.role === "user" ? "You said: " : "VFM said: "}</span>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3.5 py-2.5 rounded-xl flex gap-1.5 items-center" style={{ background: "var(--panel)" }}>
                    <span className="sr-only">Thinking…</span>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-[5px] h-[5px] rounded-full"
                        style={{
                          background: "var(--ink-mute)",
                          animation: `blink 1s ${i * 0.18}s ease infinite`,
                        }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {errMsg && (
              <p role="alert" className="px-4 pb-2 text-[12px]" style={{ color: "#a33" }}>
                {errMsg}
              </p>
            )}

            {!isLoggedIn && (
              <p className="px-4 pb-2 text-[12px]" style={{ color: "var(--ink-mute)" }}>
                Log in to ask follow-up questions.
              </p>
            )}

            <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="text-[12px] px-2.5 py-1.5 rounded-full transition-colors"
                  style={{
                    border: "1px solid var(--rule)",
                    color: "var(--ink-soft)",
                    background: "transparent",
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
              className="px-4 py-3 flex gap-2"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              <label htmlFor={inputId} className="sr-only">
                Ask a question about these listings
              </label>
              <input
                id={inputId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about delivery, condition, or which to choose…"
                autoComplete="off"
                className="field flex-1"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn flex-shrink-0"
                style={{ minHeight: 44 }}
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
