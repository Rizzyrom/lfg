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
          'bg-secondary': '#0F1218',
          panel: '#1E222D',
          'panel-hover': '#232732',
          grid: '#2A2E39',
          'grid-soft': 'rgba(42, 46, 57, 0.6)',
          text: '#D1D4DC',
          'text-soft': '#787B86',
          'text-muted': '#4E5360',
          blue: '#2962FF',
          'blue-hover': '#3D76FF',
          'blue-active': '#1E4FCC',
          up: '#26A69A',
          'up-hover': '#2CBBA9',
          down: '#EF5350',
          'down-hover': '#F44336',
          chip: '#2B2F3A',
          hover: '#313642',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      boxShadow: {
        panel: '0 0 0 1px #2A2E39',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 3px 8px rgba(0, 0, 0, 0.2)',
        'elevation-3': '0 3px 6px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)',
        'elevation-4': '0 6px 12px rgba(0, 0, 0, 0.6), 0 10px 30px rgba(0, 0, 0, 0.4)',
        'glow-blue': '0 0 20px rgba(41, 98, 255, 0.3)',
        'glow-green': '0 0 20px rgba(38, 166, 154, 0.3)',
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
