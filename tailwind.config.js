/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#FFFFFF',
          900: '#F5F8FD',
          800: '#FFFFFF',
          700: '#E4EAF7',
          600: '#C9D6EE',
        },
        parchment: {
          100: '#13284A',
          200: '#1C355E',
          400: '#51648A',
          600: '#8496B8',
        },
        gold: {
          400: '#2F63EB',
          500: '#1D3E9E',
          600: '#132B72',
        },
        card: {
          red: '#A6362C',
          redDim: '#7A2823',
        },
        felt: {
          500: '#2E7D5B',
          600: '#245F46',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
