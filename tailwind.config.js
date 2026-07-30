/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Mirrors the CSS custom properties in globals.css so utilities and
      // inline styles can't drift apart. Edit the palette there, not here.
      colors: {
        paper: "var(--paper)",
        "paper-deep": "var(--paper-deep)",
        panel: "var(--panel)",
        "panel-alt": "var(--panel-alt)",
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-mute": "var(--ink-mute)",
        accent: "var(--accent)",
        "accent-deep": "var(--accent-deep)",
        "accent-wash": "var(--accent-wash)",
        flag: "var(--flag)",
        "flag-wash": "var(--flag-wash)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter Tight", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      maxWidth: {
        prose: "62ch",
      },
      animation: {
        riseIn: "riseIn 0.4s cubic-bezier(.22,1,.36,1) both",
        fadeIn: "fadeIn 0.3s ease both",
      },
    },
  },
  plugins: [],
};
