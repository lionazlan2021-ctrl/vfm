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
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#07090a" }}
    >
      <div className="text-center max-w-[420px]">
        <div className="text-[40px] mb-3.5" aria-hidden="true">
          ⚠️
        </div>
        <h1 className="font-semibold mb-1.5 text-lg" style={{ color: "#ddeede" }}>
          Something went wrong
        </h1>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "#8aaa8e" }}>
          An unexpected error stopped the page from loading. Trying again usually fixes it.
        </p>
        {error.digest && (
          <p className="text-[11px] mb-5" style={{ color: "#3d5542" }}>
            Reference: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button onClick={reset} className="btn-jade">
            Try again
          </button>
          {/* A plain anchor, not next/link, on purpose: this boundary renders
              because React state is already broken, and a full page load is
              more likely to recover than a client-side navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="btn-ghost inline-flex items-center">
            Back to search
          </a>
        </div>
      </div>
    </div>
  );
}
