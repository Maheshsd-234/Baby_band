import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx,js}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1C1C1E",
          muted: "#F2F2F7",
          accent: "#FF453A",
          calm: "#D1D1D6",
        },
      },
      boxShadow: {
        "soft-card": "0 25px 60px -20px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        pulseBanner: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "pulse-banner": "pulseBanner 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

