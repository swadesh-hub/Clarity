/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B3726',
          light: '#2D5A3D',
        },
        sage: {
          DEFAULT: '#D4E4D0',
          light: '#E8F0E5',
        },
        cream: {
          DEFAULT: '#F8F6F2',
          dark: '#F0EDE8',
        },
        mist: '#D6DDE8',
        charcoal: '#1A1D1A',
        border: '#E6E3DE',
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
        serif: ['DM Serif Display', 'serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
