"use client";

import { useEffect, useRef } from "react";

/**
 * A thin green bar along the top edge showing how far down the page you are.
 * Written straight to the DOM on scroll (via a ref) rather than through React
 * state, so scrolling never triggers a re-render.
 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
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

  return (
    <div aria-hidden="true" className="fixed top-0 left-0 right-0 z-[60]" style={{ height: 2 }}>
      <div
        ref={bar}
        style={{
          height: "100%",
          background: "var(--accent)",
          transform: "scaleX(0)",
          transformOrigin: "0 50%",
        }}
      />
    </div>
  );
}
