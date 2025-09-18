/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#07C160',
        secondary: '#EDEDED',
        accent: '#1AAD19',
        background: '#e5e5e5',
        surface: '#e5e5e5',
        text: '#191919',
        'text-secondary': '#888888',
        border: '#E5E5E5',
        error: '#FA5151',
        warning: '#FF9500',
        success: '#07C160',
        info: '#10AEFF'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    },
  },
  plugins: [],
}
