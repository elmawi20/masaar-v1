import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        medical: {
          blue: "#0284c7",
          cyan: "#06b6d4",
          amber: "#d97706",
          rose: "#e11d48",
          emerald: "#059669",
        }
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-cairo)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(6, 78, 59, 0.04)',
        'xs': '0 1px 3px 0 rgba(6, 78, 59, 0.06), 0 1px 2px -1px rgba(6, 78, 59, 0.06)',
        'sm': '0 2px 4px 0 rgba(6, 78, 59, 0.06), 0 1px 2px -1px rgba(6, 78, 59, 0.06)',
        'DEFAULT': '0 3px 8px -1px rgba(6, 78, 59, 0.08), 0 2px 4px -2px rgba(6, 78, 59, 0.05)',
        'md': '0 6px 16px -2px rgba(6, 78, 59, 0.09), 0 3px 8px -2px rgba(6, 78, 59, 0.06)',
        'lg': '0 12px 28px -4px rgba(6, 78, 59, 0.12), 0 6px 12px -4px rgba(6, 78, 59, 0.07)',
        'xl': '0 20px 35px -5px rgba(6, 78, 59, 0.15), 0 10px 16px -5px rgba(6, 78, 59, 0.08)',
        '2xl': '0 25px 50px -12px rgba(6, 78, 59, 0.20)',
      },
    },
  },
  plugins: [],
};
export default config;
