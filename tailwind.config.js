/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/frontend/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#36a9f5',
          500: '#0c8ee7',
          600: '#0070c4',
          700: '#01599f',
          800: '#064c83',
          900: '#0a406d',
          950: '#07284a',
        },
      },
    },
  },
  plugins: [],
}
