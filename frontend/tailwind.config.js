/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      minHeight: {
        '44': '44px', // Mobile-first tap targets
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
