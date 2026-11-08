"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A statement whose words light up, one after another, as it scrolls through
 * the viewport — reading pace set by the reader's own scrolling.
 *
 * Every word is in the DOM at full strength for screen readers and search
 * engines; only the painted opacity changes. With reduced motion it's simply
 * shown lit.
 */
export default function ScrollHighlight({
  parts,
  className = "",
  style,
}: {
  /** Text in runs; `accent` runs are coloured green once lit. */
  parts: { text: string; accent?: boolean }[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(1);

  const words = parts.flatMap((p) =>
    p.text
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ w, accent: Boolean(p.accent) }))
  );

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top of the text reaches 85% down the screen; 1 by the time
      // its bottom has risen to 45%.
      const p = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const lit = Math.round(progress * words.length);

  return (
    <p ref={ref} className={className} style={style}>
      {words.map(({ w, accent }, i) => (
        <span
          key={i}
          style={{
            opacity: i < lit ? 1 : 0.16,
            color: accent && i < lit ? "var(--accent)" : undefined,
            transition: "opacity .35s ease, color .35s ease",
          }}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
