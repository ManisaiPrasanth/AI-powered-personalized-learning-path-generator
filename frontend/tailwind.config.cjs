/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#00D4FF'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'soft-xl': '0 18px 40px rgba(15,23,42,0.7)'
      }
    }
  },
  plugins: []
};

