/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#111827",
          hover: "#1f2937",
          border: "#374151",
          muted: "#9ca3af",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f3f4f6",
          canvas: "#f9fafb",
        },
        primary: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          soft: "#dbeafe",
        },
        critical: { bg: "#fee2e2", text: "#b91c1c" },
        high: { bg: "#ffedd5", text: "#c2410c" },
        medium: { bg: "#fef9c3", text: "#a16207" },
        low: { bg: "#f3f4f6", text: "#4b5563" },
        success: { bg: "#dcfce7", text: "#15803d" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};
