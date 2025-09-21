/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2ff',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        accent: {
          50: '#effdf6',
          100: '#d9fbe8',
          200: '#b4f5d3',
          300: '#7ee8b2',
          400: '#4ad28f',
          500: '#28b370',
          600: '#1c8e56',
          700: '#166f44',
          800: '#155639',
          900: '#0f3a27'
        },
        warning: {
          100: '#fff4cc',
          500: '#f59e0b',
          700: '#b45309'
        },
        danger: {
          100: '#fee2e2',
          500: '#ef4444',
          700: '#b91c1c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        brand: '0 18px 40px -15px rgba(79, 70, 229, 0.35)'
      }
    },
  },
  plugins: [],
};
