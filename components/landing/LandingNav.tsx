"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#weigh", label: "What we weigh" },
  { href: "/pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Top bar for the landing page. Transparent over the hero, then solid paper
 * with a rule once you scroll, so it stays legible over content. Solid rather
 * than frosted glass: the design standards rule out glassmorphism.
 */
export default function LandingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-colors duration-300"
      style={{
        background: scrolled ? "var(--paper)" : "transparent",
        borderBottom: `1px solid ${scrolled ? "var(--rule)" : "transparent"}`,
      }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" aria-label="VFM home">
          <Logo size={20} />
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="landing-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!signedIn && (
            <Link href="/app" className="landing-link hidden sm:inline-flex px-2">
              Log in
            </Link>
          )}
          <Link href="/app" className="btn" style={{ padding: "9px 16px", minHeight: 40 }}>
            {signedIn ? "Open VFM" : "Try it free"}
          </Link>
        </div>
      </div>
    </header>
  );
}
