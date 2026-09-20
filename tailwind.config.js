/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0",
          800: "#1e293b", 900: "#0f172a", 950: "#020617"
        },
        risk: {
          green: "#10b981", amber: "#f59e0b",
          red: "#ef4444", critical: "#b91c1c"
        }
      },
    },
  },
  plugins: [],
};
