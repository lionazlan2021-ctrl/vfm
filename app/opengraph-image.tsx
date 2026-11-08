import { ImageResponse } from "next/og";

/** The preview card shown when someone shares a VFM link. */
export const alt = "VFM — the cheapest price is rarely the best value.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SUBTITLE = "Three real sellers, weighed on condition, trust, shipping and warranty.";
// Every character drawn in Fraunces, so the subset font covers all of them.
const FONT_TEXT = `VFM.The cheapest price is rarely the best value.${SUBTITLE}`;

/**
 * Fraunces, the site's display face, subset to just the characters drawn here.
 * Returns null if Google Fonts can't be reached, and the image falls back to
 * the built-in sans rather than failing the build.
 */
async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@144,600&text=${encodeURIComponent(FONT_TEXT)}`
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const fraunces = await loadFraunces();
  const display = fraunces ? "Fraunces" : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbf7ef",
          padding: "72px 80px",
          color: "#17190f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="88" height="88" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="15" fill="#1f6f43" />
            <path d="M15 20.5 28.5 45.5" fill="none" stroke="#fbf7ef" strokeWidth="9" strokeLinecap="round" />
            <path d="M28.5 45.5 49 15" fill="none" stroke="#fbf7ef" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="48.5" cy="45.5" r="4.6" fill="#fbf7ef" />
          </svg>
          <div style={{ display: "flex", fontFamily: display, fontSize: 66, letterSpacing: -2 }}>
            VFM<span style={{ color: "#1f6f43" }}>.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: display,
              fontSize: 84,
              letterSpacing: -1.5,
              lineHeight: 1.04,
            }}
          >
            <span>The cheapest price is rarely</span>
            <span style={{ display: "flex" }}>
              the<span style={{ color: "#1f6f43", marginLeft: 20 }}>best value.</span>
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#4a4f3f" }}>
            {SUBTITLE}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces ? [{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" }] : [],
    }
  );
}
