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
          // Ultra-minimal monochrome backgrounds
          bg: '#FAFAFA',
          'bg-secondary': '#F5F5F5',
          panel: '#FFFFFF',
          'panel-hover': '#F8F8F8',
          grid: '#E5E5E5',
          'grid-soft': 'rgba(0, 0, 0, 0.06)',

          // Clean text hierarchy
          text: '#000000',
          'text-soft': '#6B7280',
          'text-muted': '#9CA3AF',

          // Single accent color - sophisticated slate blue
          blue: '#475569',
          'blue-hover': '#334155',
          'blue-active': '#1e293b',

          // Minimal status colors
          up: '#10B981',
          'up-hover': '#059669',

          down: '#EF4444',
          'down-hover': '#DC2626',

          // UI elements
          chip: '#F3F4F6',
          hover: '#F9FAFB',
          border: 'rgba(0, 0, 0, 0.08)',
        },
      },
      boxShadow: {
        panel: '0 1px 3px rgba(0, 0, 0, 0.05)',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'elevation-2': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 4px 8px rgba(0, 0, 0, 0.08)',
        'elevation-4': '0 8px 16px rgba(0, 0, 0, 0.1)',
        'glow-blue': '0 0 0 3px rgba(0, 102, 255, 0.1)',
        'glow-green': '0 0 0 3px rgba(16, 185, 129, 0.1)',
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
