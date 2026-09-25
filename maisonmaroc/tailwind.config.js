/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tajawal", "Cairo", "system-ui", "sans-serif"],
        arabic: ["Tajawal", "Cairo", "system-ui", "sans-serif"],
        display: ["Cairo", "Tajawal", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        latin: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#f4f6f9",
          muted: "#eef1f6",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        navy: {
          DEFAULT: "#1a2332",
          800: "#151c28",
          900: "#0f1419",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 4px 12px rgba(15, 23, 42, 0.1), 0 16px 40px rgba(15, 23, 42, 0.12)",
        hero: "0 20px 50px rgba(0, 0, 0, 0.25)",
        search: "0 12px 40px rgba(15, 23, 42, 0.15)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
