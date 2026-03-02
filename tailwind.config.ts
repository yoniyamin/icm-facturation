import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EDF5FD",
          100: "#D4E8FA",
          200: "#A8D1F5",
          300: "#7DB9EF",
          400: "#52A2EA",
          500: "#4A90D9",
          600: "#3A73B0",
          700: "#2D5A8A",
          800: "#1F3F63",
          900: "#14293F",
        },
        accent: {
          50: "#FFF9EB",
          100: "#FFF0CC",
          200: "#FFE099",
          300: "#FFD066",
          400: "#F5B731",
          500: "#D4A843",
          600: "#B8922A",
          700: "#8C6F1F",
          800: "#604C15",
          900: "#3D300D",
        },
        warm: {
          50: "#FFFDF8",
          100: "#FFF9EE",
          200: "#FFF3DD",
          300: "#FFECCC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
