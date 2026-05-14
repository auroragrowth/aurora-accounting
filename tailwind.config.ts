import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#173F87",
          "blue-deep": "#0E2A5C",
          "blue-light": "#2056B5",
          orange: "#E8551C",
          "orange-soft": "#FFE8DC",
          cream: "#FAF8F3",
          ink: "#0F1419",
          "ink-soft": "#4A5568",
          line: "#E8E5DC",
        },
      },
      fontFamily: {
        display: ['"Bowlby One SC"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
