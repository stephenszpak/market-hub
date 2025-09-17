import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006DA8',
        link: '#007ABB',
      }
    },
  },
  plugins: [],
} satisfies Config

