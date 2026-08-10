import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad9ad',
          300: '#f6bc7b',
          400: '#f19747',
          500: '#ed7721',
          600: '#de5c17',
          700: '#b84213',
          800: '#933616',
          900: '#772f14',
          950: '#401409',
        },
      },
    },
  },
  plugins: [],
} satisfies Config