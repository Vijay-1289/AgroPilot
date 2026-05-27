/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        organic: {
          green: '#2D6A4F',      // Primary Green
          leaf: '#52B788',       // Leaf Accent
          brown: '#7C5C3A',      // Soil Brown
          cream: '#F8F4EC',      // Cream Background
          darkGreen: '#1B4332',
          lightGreen: '#D8F3DC',
        },
        alert: {
          red: '#D62828',
          amber: '#F4A261',
          green: '#40916C',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
