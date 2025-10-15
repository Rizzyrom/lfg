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
          // Modern black backgrounds (Robinhood/Coinbase style)
          bg: '#000000',
          'bg-secondary': '#0A0A0A',
          panel: '#1A1A1A',
          'panel-hover': '#242424',
          grid: '#2A2A2A',
          'grid-soft': 'rgba(42, 42, 42, 0.6)',

          // Clean, high-contrast text
          text: '#FFFFFF',
          'text-soft': '#9CA3AF',
          'text-muted': '#6B7280',

          // Modern electric blue (primary action color)
          blue: '#0066FF',
          'blue-hover': '#0052CC',
          'blue-active': '#003D99',

          // Vibrant success green
          up: '#00D084',
          'up-hover': '#00B870',

          // Bold danger red
          down: '#FF4757',
          'down-hover': '#E63946',

          // UI elements
          chip: '#242424',
          hover: '#2E2E2E',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      boxShadow: {
        panel: '0 0 0 1px #2A2A2A',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 3px 8px rgba(0, 0, 0, 0.2)',
        'elevation-3': '0 3px 6px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)',
        'elevation-4': '0 6px 12px rgba(0, 0, 0, 0.6), 0 10px 30px rgba(0, 0, 0, 0.4)',
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.4)',
        'glow-green': '0 0 20px rgba(0, 208, 132, 0.4)',
      },
      fontFeatureSettings: {
        tnum: '"tnum" on',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'slide-up': 'slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in': {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(41, 98, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(41, 98, 255, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
