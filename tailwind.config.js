/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'navy-deep':      '#0C1A33',
        'navy-mid':       '#162544',
        'navy-light':     '#1E3055',
        'gold':           '#C4A24E',
        'gold-light':     '#D4B87A',
        'gold-muted':     '#8B7332',
        'cream':          '#E8D5A0',
        'cream-light':    '#F5EDD8',
        'page-bg':        '#F4F2ED',
        'card-bg':        '#FFFFFF',
        'text-primary':   '#0C1A33',
        'text-secondary': '#5A6478',
        'text-tertiary':  '#8B93A1',
        'accent-green':   '#2D8F65',
        'accent-red':     '#C0392B',
        'accent-amber':   '#C4A24E',
        'accent-blue':    '#4A6FA5',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
