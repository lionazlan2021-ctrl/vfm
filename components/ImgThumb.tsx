"use client";

import { useState, useEffect } from "react";

export default function ImgThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!url) return null;

  return (
    <div className="relative flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-11 h-11 object-cover rounded-[9px]" style={{ border: "1px solid #2dbe5f40" }} />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center"
        style={{ background: "#ef4444", color: "#fff", border: "none" }}
      >
        ✕
      </button>
    </div>
  );
}
