import type { Config } from "tailwindcss";

/**
 * Forward Collective design tokens.
 * Flat, flush, no gradients, no shadows, no radius unless explicit.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // Reset radius — nothing is rounded unless a component opts in.
    borderRadius: {
      none: "0",
    },
    extend: {
      colors: {
        // Light palette. Flat, flush, grid-to-grid.
        bg: "#FFFFFF",
        surface: "#F3F2EF",
        border: "#E3E1DC",
        text: "#141414",
        muted: "#8C8A85",
        gold: "#A6822E",
        "gold-light": "#C9A84C",
        // Dark ink used for text on gold/accent fills.
        ink: "#141414",
        error: "#8B3A3A",
      },
      fontFamily: {
        // Inter is loaded via next/font in layout.tsx as a CSS variable.
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        display: "-0.02em",
        body: "0.05em",
        label: "0.25em",
        "label-wide": "0.3em",
      },
      transitionTimingFunction: {
        fc: "ease",
      },
      transitionDuration: {
        color: "200ms",
        transform: "600ms",
      },
    },
  },
  plugins: [],
};

export default config;
