"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import type { User, ApiErrorBody } from "@/types";

/**
 * Login / signup dialog.
 *
 * Keyboard and screen-reader behaviour this relies on:
 *   - Escape closes it, and focus returns to whatever opened it.
 *   - Tab is trapped inside the dialog while it is open.
 *   - It is a real <form>, so Enter submits from any field.
 *   - Every input has a matching <label> and an autoComplete hint.
 *   - Errors are announced via role="alert".
 */
export default function AuthModal({
  onClose,
  onAuth,
}: {
  onClose: () => void;
  onAuth: (u: User) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  /**
   * Whether the server has Google credentials configured. Null until known, so
   * the button doesn't flash in and out on first paint.
   */
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const ids = useId();
  const titleId = `${ids}-title`;
  const errorId = `${ids}-error`;
  const nameId = `${ids}-name`;
  const emailId = `${ids}-email`;
  const pwId = `${ids}-pw`;

  const close = useCallback(() => {
    onClose();
    openerRef.current?.focus?.();
  }, [onClose]);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
  }, []);

  // Ask the server whether Google sign-in is available. Failing quietly to
  // "unavailable" is right: password login still works, and an error banner
  // about an optional button would be noise.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { googleEnabled?: boolean }) => {
        if (!cancelled) setGoogleEnabled(Boolean(d.googleEnabled));
      })
      .catch(() => {
        if (!cancelled) setGoogleEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setErr("");

    if (mode === "signup" && !name.trim()) {
      setErr("Enter your name.");
      return;
    }
    if (!email.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { email, password: pw } : { name, email, password: pw };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: User } & ApiErrorBody;

      if (!res.ok || !data.user) {
        setErr(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      onAuth(data.user);
    } catch {
      setErr("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(23,25,15,.36)", animation: "fadeIn .2s ease" }}
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] p-7"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--rule-strong)",
          borderRadius: "var(--radius-card)",
          animation: "riseIn .25s ease both",
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="eyebrow mb-2">{mode === "login" ? "Welcome back" : "Get started"}</p>
            <h2 id={titleId} className="display text-[26px]" style={{ color: "var(--ink)" }}>
              {mode === "login" ? "Log in" : "Create an account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 flex items-center justify-center"
            style={{ minWidth: 40, minHeight: 40, color: "var(--ink-mute)", background: "none", border: "none" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {googleEnabled && (
          <>
            <a
              href="/api/auth/google"
              className="btn-quiet w-full"
              style={{ marginBottom: 6, textDecoration: "none" }}
            >
              {/* Google's mark, inlined — an external image would be blocked
                  and would leak a request to Google before consent. */}
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z" />
                <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z" />
                <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.2-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z" />
                <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.4 2 7.9 7 4.3 14.2l7.3 5.7c1.7-5.2 6.6-9.1 12.4-9.1z" />
              </svg>
              Continue with Google
            </a>

            <div className="flex items-center gap-3 my-4" aria-hidden="true">
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
              <span className="eyebrow" style={{ fontSize: 10 }}>
                or
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
            </div>
          </>
        )}

        <form onSubmit={submit} noValidate className="space-y-3">
          {mode === "signup" && (
            <div>
              <label htmlFor={nameId} className="eyebrow block mb-1.5" style={{ fontSize: 10 }}>
                Name
              </label>
              <input
                id={nameId}
                ref={mode === "signup" ? firstFieldRef : undefined}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="field"
              />
            </div>
          )}

          <div>
            <label htmlFor={emailId} className="eyebrow block mb-1.5" style={{ fontSize: 10 }}>
              Email
            </label>
            <input
              id={emailId}
              ref={mode === "login" ? firstFieldRef : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-invalid={Boolean(err) || undefined}
              aria-describedby={err ? errorId : undefined}
              className="field"
            />
          </div>

          <div>
            <label htmlFor={pwId} className="eyebrow block mb-1.5" style={{ fontSize: 10 }}>
              Password
            </label>
            <input
              id={pwId}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              type="password"
              placeholder="At least 8 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-invalid={Boolean(err) || undefined}
              aria-describedby={err ? errorId : undefined}
              className="field"
            />
          </div>

          {err && (
            <p id={errorId} role="alert" className="text-[12.5px]" style={{ color: "#a33" }}>
              {err}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn w-full" style={{ marginTop: 8 }}>
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] mt-5" style={{ color: "var(--ink-mute)" }}>
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setErr("");
            }}
            className="underline"
            style={{ color: "var(--accent)", background: "none", border: "none" }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
