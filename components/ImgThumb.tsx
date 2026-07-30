"use client";

import { useState, useEffect } from "react";

export default function ImgThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    // Revoked on unmount so the blob doesn't leak.
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!url) return null;

  return (
    <div className="relative flex-shrink-0 ml-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Selected photo: ${file.name}`}
        className="w-10 h-10 object-cover rounded-lg"
        style={{ border: "1px solid var(--rule-strong)" }}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
