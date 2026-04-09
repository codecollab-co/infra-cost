import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#050505",
          secondary: "#0d0d0d",
          tertiary: "#141414",
          card: "#1a1a1a",
          elevated: "#202020",
        },
        neon: {
          green: "#00ff87",
          "green-dim": "#00cc6a",
          "green-dark": "#007a40",
          cyan: "#00d4ff",
          "cyan-dim": "#00a8cc",
        },
        border: {
          default: "#262626",
          subtle: "#1a1a1a",
          bright: "#333333",
          green: "rgba(0,255,135,0.3)",
        },
        text: {
          primary: "#f2f2f2",
          secondary: "#a0a0a0",
          muted: "#606060",
        },
        terminal: {
          bg: "#0a0a0a",
          header: "#1a1a1a",
          green: "#00ff87",
          cyan: "#00d4ff",
          yellow: "#ffbd2e",
          red: "#ff6b6b",
          gray: "#666666",
          white: "#f2f2f2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "Menlo", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,255,135,0.15) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(0,255,135,0.05) 0%, rgba(0,212,255,0.02) 100%)",
        "glow-green":
          "radial-gradient(ellipse at center, rgba(0,255,135,0.2) 0%, transparent 70%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        "neon-green": "0 0 20px rgba(0,255,135,0.3), 0 0 60px rgba(0,255,135,0.1)",
        "neon-green-sm": "0 0 10px rgba(0,255,135,0.2)",
        "neon-cyan": "0 0 20px rgba(0,212,255,0.3)",
        card: "0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,135,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-up": "slideUp 0.6s ease forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "typing-cursor": "blink 1s step-end infinite",
        "scan-line": "scanLine 8s linear infinite",
        "particle-drift": "particleDrift 20s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,255,135,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(0,255,135,0.5), 0 0 80px rgba(0,255,135,0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        particleDrift: {
          "0%": { transform: "translateX(-100px) translateY(0px)" },
          "100%": { transform: "translateX(100vw) translateY(-200px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
