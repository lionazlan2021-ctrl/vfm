"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api-client";

type Health =
  | { ok: true; model: string; latencyMs: number }
  | { ok: false; model: string; reason: string };

/**
 * The "Test AI connection" button. Runs only when pressed: the check makes a
 * real (tiny) paid request, so it must never fire just because the dashboard
 * was opened.
 */
export default function AiHealthCheck() {
  const [state, setState] = useState<
    { status: "idle" } | { status: "checking" } | { status: "done"; health: Health } | { status: "error"; message: string }
  >({ status: "idle" });

  async function run() {
    setState({ status: "checking" });
    try {
      const health = await apiFetch<Health>("/api/admin/health", { method: "POST" });
      setState({ status: "done", health });
    } catch (e) {
      setState({ status: "error", message: errorMessage(e, "The check couldn't run.") });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={state.status === "checking"}
        className="btn btn-quiet"
        style={{ padding: "8px 14px", fontSize: 13 }}
      >
        {state.status === "checking" ? "Checking…" : "Test AI connection"}
      </button>

      <p className="text-[13px]" role="status" aria-live="polite">
        {state.status === "idle" && (
          <span style={{ color: "var(--ink-mute)" }}>
            Sends one tiny request (well under a cent) to confirm searches can run.
          </span>
        )}
        {state.status === "done" && state.health.ok && (
          <span style={{ color: "var(--accent)" }}>
            Working — {state.health.model.replace(/-\d{8}$/, "")} answered in{" "}
            {(state.health.latencyMs / 1000).toFixed(1)}s.
          </span>
        )}
        {state.status === "done" && !state.health.ok && (
          <span style={{ color: "var(--alert)" }}>Not working: {state.health.reason}</span>
        )}
        {state.status === "error" && (
          <span style={{ color: "var(--alert)" }}>{state.message}</span>
        )}
      </p>
    </div>
  );
}
