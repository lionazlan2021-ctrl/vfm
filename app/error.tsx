"use client";

import { useEffect } from "react";

/**
 * Catches render-time errors anywhere in the app. Without this, an unexpected
 * throw shows a blank page in production.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest correlates this to the server log; the message itself is not
    // shown to the user, since it can contain internal detail.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center px-5 md:px-16">
      <div className="max-w-2xl">
        <p className="eyebrow mb-4">Error</p>
        <h1 className="display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--ink)" }}>
          Something broke
        </h1>
        <p className="text-[15px] leading-relaxed max-w-prose mb-8" style={{ color: "var(--ink-soft)" }}>
          An unexpected error stopped this page from loading. Trying again usually fixes it.
        </p>
        {error.digest && (
          <p className="numeric text-[12px] mb-6" style={{ color: "var(--ink-mute)" }}>
            Reference {error.digest}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <button onClick={reset} className="btn">
            Try again
          </button>
          {/* A plain anchor, not next/link, on purpose: this boundary renders
              because React state is already broken, and a full page load is
              more likely to recover than a client-side navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="btn-quiet inline-flex items-center">
            Back to search
          </a>
        </div>
      </div>
    </main>
  );
}
