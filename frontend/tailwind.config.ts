import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#fbf7f2",
        ink: "#1f1f1f",
        coral: "#ff385c",
        stone: "#6a6a6a",
        line: "#e7e2db",
        // Paleta del dashboard
        "dash-bg": "#f0ede8",
        "dash-accent": "#e8184a",
        "dash-success": "#0f9172",
        "dash-warning": "#f59e0b",
        "dash-error": "#dc2626",
        // Paleta de marca Terrify
        primary: {
          DEFAULT: "#7A3B24",
          dark: "#5C2C1B",
        },
        secondary: {
          DEFAULT: "#3F5940",
        },
        cta: {
          DEFAULT: "#D19A3D",
          dark: "#A87427",
        },
        success: "#4A7C4E",
        warning: "#C08A3E",
        danger: "#A83E2E",
        background: {
          DEFAULT: "#F3EEE4",
          alt: "#E8E1D3",
        },
        text: {
          DEFAULT: "#2B241E",
          muted: "#6B6355",
        },
      },
      boxShadow: {
        panel: "0 12px 40px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "Segoe UI", "sans-serif"],
        display: ["var(--font-sora)", "Sora", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
