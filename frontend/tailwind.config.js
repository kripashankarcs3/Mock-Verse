/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      transitionDuration: {
        400: "400ms",
      },
    },
  },
  plugins: [],
};
