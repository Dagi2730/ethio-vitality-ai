/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: "#FAFAF8",
          surface: "#FFFFFF",
          border: "#E8E6E1",
        },
        teal: {
          DEFAULT: "#1D9E75",
          light: "#E1F5EE",
          muted: "#EAF3DE",
        },
        amber: {
          alert: "#EF9F27",
          wash: "#FAEEDA",
        },
        coral: {
          wash: "#FAECE7",
        },
        ink: {
          DEFAULT: "#2C2C2A",
          muted: "#888780",
        },
        sanctuary: {
          lavender: "#E8E0F5",
          peach: "#FFE8DC",
          mint: "#D8F0E8",
          sky: "#DCEEF8",
          rose: "#F5E0EA",
          gold: "#F5D76E",
          honey: "#E8B84A",
        },
        vitality: {
          50: "#FAFAF8",
          100: "#E1F5EE",
          200: "#C5E8DC",
          300: "#9FD4BF",
          400: "#6BB89A",
          500: "#1D9E75",
          600: "#1D9E75",
          700: "#178564",
          800: "#2C2C2A",
          900: "#2C2C2A",
        },
        calm: {
          50: "#FAFAF8",
          100: "#F5F4F0",
          200: "#E8E6E1",
          300: "#C4C2BC",
          400: "#888780",
          500: "#888780",
          600: "#6B6963",
          700: "#4A4844",
          800: "#2C2C2A",
          900: "#2C2C2A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        sanctuary: "0 8px 32px rgba(44, 44, 42, 0.06), 0 2px 8px rgba(44, 44, 42, 0.04)",
        "sanctuary-lg": "0 16px 48px rgba(44, 44, 42, 0.08)",
        glow: "0 0 40px rgba(29, 158, 117, 0.15)",
      },
      maxWidth: {
        chat: "680px",
      },
      transitionDuration: {
        mood: "300ms",
        breathe: "4000ms",
      },
      animation: {
        "fade-in": "fadeIn 220ms ease forwards",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
