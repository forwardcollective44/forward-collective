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
        bg: "#080808",
        surface: "#0D0D0D",
        border: "#1E1E1E",
        text: "#EFEFEF",
        muted: "#555555",
        gold: "#C9A84C",
        "gold-light": "#E8D5A3",
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
