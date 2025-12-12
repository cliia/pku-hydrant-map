/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#e11d48',
        accent: '#22d3ee'
      },
      boxShadow: {
        glass: '0 10px 40px rgba(0,0,0,0.25)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
