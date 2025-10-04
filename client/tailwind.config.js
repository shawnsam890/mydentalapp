/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#90ceff',
          400: '#5ab4ff',
          500: '#2b95ff',
          600: '#0c72e3',
          700: '#0559b6',
          800: '#094d91',
          900: '#0d4175'
        }
      }
    }
  },
  plugins: []
};
