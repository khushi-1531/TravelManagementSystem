/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B192C',
          darkBlue: '#1E3E62',
          deep: '#0F172A',
          teal: '#0D9488',
          tealHover: '#0F766E',
          emerald: '#059669',
          gold: '#D97706',
          goldHover: '#B45309',
          sand: '#F59E0B',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
