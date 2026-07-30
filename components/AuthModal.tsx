"use client";

import { useState } from "react";
import type { User } from "@/types";

export default function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setErr("Enter your name.");
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
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      onAuth(data.user);
    } catch {
      setErr("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.6)", animation: "fadeIn .2s ease" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-[18px] p-6 w-[340px]"
        style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)", animation: "fadeUp .25s ease" }}
      >
        <div className="flex justify-between mb-4">
          <span className="text-base font-bold" style={{ color: "#ddeede" }}>
            {mode === "login" ? "Log in" : "Sign up"}
          </span>
          <button onClick={onClose} className="text-base" style={{ color: "#3d5542", background: "none", border: "none" }}>
            ✕
          </button>
        </div>

        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-2.5"
            style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)", color: "#ddeede" }}
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-2.5"
          style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)", color: "#ddeede" }}
        />
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          placeholder="Password (min. 8 characters)"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full rounded-[10px] px-3 py-2.5 text-[13px] mb-2.5"
          style={{ background: "#0f1410", border: "1px solid rgba(45,190,95,0.09)", color: "#ddeede" }}
        />

        {err && (
          <div className="text-[11px] mb-2.5" style={{ color: "#fca5a5" }}>
            ⚠️ {err}
          </div>
        )}

        <button onClick={submit} disabled={loading} className="btn-jade w-full mb-2.5">
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <div className="text-center text-xs" style={{ color: "#3d5542" }}>
          {mode === "login" ? "No account?" : "Already registered?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setErr("");
            }}
            className="text-xs"
            style={{ color: "#2dbe5f", background: "none", border: "none" }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
