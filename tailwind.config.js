/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f7f7f6',
          100: '#eeedeb',
          200: '#e0dedb',
          300: '#c9c6c1',
          400: '#a39e97',
          500: '#7d786f',
          600: '#5f5b54',
          700: '#4a4741',
          800: '#33312d',
          900: '#211f1d',
          950: '#141312',
        },
        accent: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a6ff',
          500: '#3385f6',
          600: '#1f66db',
          700: '#1a51b0',
          800: '#1b458c',
          900: '#1b3c71',
        },
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in .18s ease-out' },
    },
  },
  plugins: [],
}
