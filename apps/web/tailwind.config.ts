// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#B21F2D",
          dark: "#8F1A26",
          light: "#D73A48",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
