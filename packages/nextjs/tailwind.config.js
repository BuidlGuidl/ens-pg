/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#AF52DE",
          "primary-content": "#212638",
          secondary: "#F3E6FB",
          "secondary-content": "#212638",
          accent: "#93BBFB",
          "accent-content": "#212638",
          neutral: "#212638",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#F5F4F6",
          "base-300": "#DAE8FF",
          "base-content": "#212638",
          info: "#F3E6FB",
          success: "#D6FFCF",
          warning: "#FFEC99",
          error: "#FFAFAF",

          "--rounded-btn": "0.75rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Satoshi", "sans-serif"],
      },
      colors: {
        "primary-green": "#33AD46",
        "primary-orange": "#F08C00",
        "primary-red": "#E03131",
        "medium-purple": "#E789FF",
        "light-purple": "#eccfff",
        "pale-rose": "#FFD8FB",
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};
