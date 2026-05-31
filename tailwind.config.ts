import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B1D3A',
        accent: '#F5A623',
        surface: '#1A2332',
        muted: '#2D3748',
      }
    },
  },
  plugins: [],
} satisfies Config
