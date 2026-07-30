"use client";

import { useState, useRef } from "react";

export default function TopSearchBar({ onSearch }: { onSearch: (q: string, file?: File | null) => void }) {
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const go = () => {
    if (q.trim()) {
      onSearch(q);
      setQ("");
    }
  };

  return (
    <div className="flex items-center gap-1.5 rounded-full pl-3.5 pr-1 py-1 max-w-[380px] flex-1" style={{ background: "#111815", border: "1px solid rgba(45,190,95,0.09)" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Search a product…"
        className="flex-1 bg-transparent border-none outline-none text-xs min-w-0"
        style={{ color: "#ddeede" }}
      />
      <button onClick={() => fileRef.current?.click()} className="text-[13px]" style={{ background: "none", border: "none", color: "#3d5542" }}>
        📸
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSearch("", f);
        }}
      />
      <button onClick={go} className="btn-jade rounded-full px-3.5 py-1.5 text-xs">
        ↑
      </button>
    </div>
  );
}
