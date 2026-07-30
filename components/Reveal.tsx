"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * Three rules this implementation follows, all learned the hard way from the
 * previous version:
 *
 *  1. Content is never left invisible. The server renders it visible, and a
 *     timeout guarantees it shows even if the observer never fires. The old
 *     version defaulted to `opacity: 0` in CSS, so anything the observer missed
 *     stayed blank forever.
 *  2. It reveals once and stays revealed. The old version removed the class on
 *     scroll-out, so scrolling back up made finished content disappear again.
 *  3. Opacity is applied inline rather than through a stylesheet class, so it
 *     can't be defeated by the CSS cascade.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Hidden only once we know JS is running and can bring it back.
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    setArmed(true);

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -24px 0px" }
    );
    obs.observe(el);

    // Safety net: whatever happens, don't leave the page blank.
    const failsafe = setTimeout(() => setShown(true), 1500);

    return () => {
      obs.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  const hidden = armed && !shown;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(14px)" : "none",
        transition:
          "opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1)",
        transitionDelay: `${delay}s`,
        willChange: hidden ? "opacity, transform" : undefined,
      }}
    >
      {children}
    </div>
  );
}
