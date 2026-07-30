"use client";

import { useState, useRef, useId } from "react";

export default function TopSearchBar({
  onSearch,
}: {
  onSearch: (q: string, file?: File | null) => void;
}) {
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onSearch(q);
    setQ("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5 flex-1 max-w-[420px]">
      <label htmlFor={id} className="sr-only">
        Search another product
      </label>
      <input
        id={id}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Compare another product…"
        className="field flex-1"
        style={{ padding: "8px 12px", fontSize: 13 }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Search by photo"
        className="btn-quiet flex-shrink-0"
        style={{ padding: "8px 10px", minWidth: 40, minHeight: 40 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSearch("", f);
        }}
      />
      <button type="submit" disabled={!q.trim()} className="btn flex-shrink-0" style={{ padding: "8px 14px", minHeight: 40 }}>
        Go
      </button>
    </form>
  );
}
