/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0c10',
          panel: 'rgba(17, 22, 34, 0.75)',
          card: 'rgba(22, 28, 45, 0.5)',
          cardHover: 'rgba(30, 37, 59, 0.8)',
        },
        accent: {
          decide: '#ff4785',
          info: '#ff9f1c',
          task: '#2ec4b6',
          letgo: '#8d99ae',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
