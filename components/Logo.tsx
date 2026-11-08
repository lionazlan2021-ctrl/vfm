/**
 * The VFM mark and wordmark.
 *
 * The mark is a V whose right arm rises past the left, so it reads as both
 * "V" and a tick — value, verified. The dot echoes the green full stop in the
 * wordmark. Stroke contrast (heavy left, light right) follows Fraunces, the
 * display face, so the mark and the lettering look like one hand.
 *
 * Colours are literal rather than CSS variables because the same drawing is
 * used for the favicon (app/icon.svg) and the share image, which can't read
 * the page's variables. Keep public/brand/*.svg in step if this changes.
 */

const GREEN = "#1f6f43";
const PAPER = "#fbf7ef";

export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, display: "block" }}
    >
      <rect width="64" height="64" rx="15" fill={GREEN} />
      <path d="M15 20.5 28.5 45.5" fill="none" stroke={PAPER} strokeWidth="9" strokeLinecap="round" />
      <path d="M28.5 45.5 49 15" fill="none" stroke={PAPER} strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="48.5" cy="45.5" r="4.6" fill={PAPER} />
    </svg>
  );
}

/** Mark plus "VFM." — the text is real text, so it scales with font-size. */
export default function Logo({ size = 19, markScale = 1.2 }: { size?: number; markScale?: number }) {
  return (
    <span className="inline-flex items-center gap-2" style={{ lineHeight: 1 }}>
      <LogoMark size={Math.round(size * markScale)} />
      <span className="display" style={{ fontSize: size, color: "var(--ink)" }}>
        VFM<span style={{ color: "var(--accent)" }}>.</span>
      </span>
    </span>
  );
}
