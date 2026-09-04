import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f5f9",
          100: "#e2ebf3",
          200: "#c6d8e8",
          300: "#9dbbd4",
          400: "#6d96ba",
          500: "#4a79a2",
          600: "#38608a",
          700: "#2f4f70",
          800: "#253d58",
          900: "#172a3e",
          950: "#101f30",
          DEFAULT: "#172a3e",
        },
        gold: {
          400: "#d4a94e",
          500: "#c2933b",
          600: "#a97b2e",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 31 48 / 0.05), 0 1px 3px 0 rgb(16 31 48 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
