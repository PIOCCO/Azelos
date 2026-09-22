/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Tajawal", "system-ui", "sans-serif"],
        arabic: ["Tajawal", "Cairo", "system-ui", "sans-serif"],
        display: ["Cairo", "Tajawal", "Inter", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598eff",
          500: "#3366ff",
          600: "#1f47f5",
          700: "#1836e1",
          800: "#1a2fb6",
          900: "#1c2e8f",
          950: "#111a52",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b0bac9",
          400: "#8593aa",
          500: "#65748e",
          600: "#505c75",
          700: "#424b5f",
          800: "#3a4151",
          900: "#1e2433",
          950: "#0f1420",
        },
        gold: {
          400: "#f5c451",
          500: "#e6a817",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.18)",
        "card-hover": "0 2px 4px rgba(16,24,40,0.06), 0 18px 40px -16px rgba(16,24,40,0.28)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
