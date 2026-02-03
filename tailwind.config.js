/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#0A0A0C',
        primary: '#6D28D9', // Deep Purple (Violet 700)
        secondary: '#94A3B8',
        accent: '#4C1D95',
        border: '#1E1B4B', // Dark Indigo Border
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        'pm': '8px'
      }
    },
  },
  plugins: [],
}
