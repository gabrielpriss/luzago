/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './**/*.html',
    './js/**/*.js',
    '!./dist/**',
    '!node_modules/**',
  ],
  theme: {
    extend: {
      colors: {
        'luzago-green-dark': '#0f4c2c',
        'luzago-green': '#197c45',
        'luzago-red': '#d52b1e',
        'luzago-yellow': '#fbb034',
        'luzago-dark': '#2c2a29',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['Bitter', 'Georgia', 'serif'],
      },
    },
  },
  safelist: [
    'bg-luzago-green-dark',
    'text-white',
    'border-luzago-green-dark',
    'bg-white',
    'text-gray-700',
    'border-gray-200',
    'hover:border-luzago-green',
    'hover:text-luzago-green',
    'hidden',
    'catalog-item',
    'product-item',
    'img-lazy',
    'is-loaded',
    'social-icon',
    'nav-link',
    'carousel-shell',
    'review-card',
    'instagram-card',
    'product-item__img-wrap',
    'catalog-filter',
  ],
};
