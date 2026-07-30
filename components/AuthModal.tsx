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
 *   - Every input has a matching <label> and an autoComplete hint so password
 *     managers can fill it.
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

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  // Remembered so focus can go back where it came from on close.
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

  // Escape to dismiss, Tab cycled within the dialog.
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

  const inputStyle = {
    background: "#0f1410",
    border: "1px solid rgba(45,190,95,0.09)",
    color: "#ddeede",
  } as const;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", animation: "fadeIn .2s ease" }}
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="rounded-[18px] p-6 w-full max-w-[340px]"
        style={{
          background: "#111815",
          border: "1px solid rgba(45,190,95,0.09)",
          animation: "fadeUp .25s ease",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-base font-bold" style={{ color: "#ddeede" }}>
            {mode === "login" ? "Log in" : "Sign up"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className="text-base leading-none px-1"
            style={{ color: "#3d5542", background: "none", border: "none" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {mode === "signup" && (
            <>
              <label htmlFor={nameId} className="sr-only">
                Full name
              </label>
              <input
                id={nameId}
                ref={mode === "signup" ? firstFieldRef : undefined}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-2.5"
                style={inputStyle}
              />
            </>
          )}

          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            ref={mode === "login" ? firstFieldRef : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={Boolean(err) || undefined}
            aria-describedby={err ? errorId : undefined}
            className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-2.5"
            style={inputStyle}
          />

          <label htmlFor={pwId} className="sr-only">
            Password
          </label>
          <input
            id={pwId}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="password"
            placeholder="Password (min. 8 characters)"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={Boolean(err) || undefined}
            aria-describedby={err ? errorId : undefined}
            className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-2.5"
            style={inputStyle}
          />

          {err && (
            <div id={errorId} role="alert" className="text-[11px] mb-2.5" style={{ color: "#fca5a5" }}>
              ⚠️ {err}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-jade w-full mb-2.5">
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="text-center text-xs" style={{ color: "#3d5542" }}>
          {mode === "login" ? "No account?" : "Already registered?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setErr("");
            }}
            className="text-xs underline"
            style={{ color: "#2dbe5f", background: "none", border: "none" }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
