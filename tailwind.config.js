/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#07090a",
        bg1: "#0b0f0c",
        bg2: "#0f1410",
        card: "#111815",
        border: "rgba(45,190,95,0.09)",
        jade: {
          DEFAULT: "#2dbe5f",
          light: "#3dde73",
          dark: "#1d9648",
        },
        fg: "#ddeede",
        fgsoft: "#8aaa8e",
        muted: "#3d5542",
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        fadeUp: "fadeUp 0.5s cubic-bezier(.22,1,.36,1) both",
        fadeIn: "fadeIn 0.4s ease both",
        glowBreath: "glowBreath 5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glowBreath: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(45,190,95,0)" },
          "50%": { boxShadow: "0 0 28px 0 rgba(45,190,95,0.13)" },
        },
      },
    },
  },
  plugins: [],
};
