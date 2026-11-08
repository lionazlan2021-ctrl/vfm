import { ImageResponse } from "next/og";

/** Home-screen icon for iOS, which ignores SVG favicons. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // Full-bleed green: iOS applies its own rounded mask, so the tile's corner
  // radius is left out here.
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1f6f43" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M15 20.5 28.5 45.5" fill="none" stroke="#fbf7ef" strokeWidth="9" strokeLinecap="round" />
          <path d="M28.5 45.5 49 15" fill="none" stroke="#fbf7ef" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="48.5" cy="45.5" r="4.6" fill="#fbf7ef" />
        </svg>
      </div>
    ),
    size
  );
}
