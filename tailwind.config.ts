import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tv: {
          bg: '#131722',
          panel: '#1E222D',
          grid: '#2A2E39',
          text: '#D1D4DC',
          'text-soft': '#787B86',
          blue: '#2962FF',
          up: '#26A69A',
          down: '#EF5350',
          chip: '#2B2F3A',
          hover: '#1B202A',
        },
      },
      boxShadow: {
        panel: '0 0 0 1px #2A2E39',
      },
      fontFeatureSettings: {
        tnum: '"tnum" on',
      },
    },
  },
  plugins: [],
}
export default config
