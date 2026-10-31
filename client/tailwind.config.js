/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07111f",
          900: "#0b1c33",
          800: "#123056",
          700: "#1b4270",
        },
        teal: {
          600: "#0d8a7b",
          700: "#0b6f63",
        },
        paper: "#f4f1ea",
        sand: "#e8e2d6",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.06)",
        lift: "0 18px 50px rgba(11,28,51,0.14)",
      },
    },
  },
  plugins: [],
};
