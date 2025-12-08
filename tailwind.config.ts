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
          // Premium backgrounds - subtle warmth
          bg: '#FAFAFA',
          'bg-secondary': '#F5F5F5',
          'bg-tertiary': '#EFEFEF',
          panel: '#FFFFFF',
          'panel-hover': '#FCFCFC',
          grid: '#E8E8E8',
          'grid-soft': 'rgba(0, 0, 0, 0.04)',

          // Premium text hierarchy
          text: '#1A1A1A',
          'text-soft': '#525252',
          'text-muted': '#8C8C8C',
          'text-placeholder': '#BFBFBF',

          // Refined accent - deeper, more sophisticated blue
          blue: '#0066FF',
          'blue-hover': '#0052CC',
          'blue-active': '#003D99',
          'blue-soft': 'rgba(0, 102, 255, 0.08)',
          'blue-glow': 'rgba(0, 102, 255, 0.15)',

          // Status colors - vibrant but refined
          up: '#00C853',
          'up-soft': 'rgba(0, 200, 83, 0.1)',
          'up-hover': '#00A844',

          down: '#FF3B30',
          'down-soft': 'rgba(255, 59, 48, 0.1)',
          'down-hover': '#E6352B',

          // Premium UI elements
          chip: '#F3F4F6',
          'chip-hover': '#E5E7EB',
          hover: '#F9FAFB',
          border: 'rgba(0, 0, 0, 0.06)',
          'border-strong': 'rgba(0, 0, 0, 0.12)',
          divider: 'rgba(0, 0, 0, 0.04)',

          // Accent colors for variety
          purple: '#8B5CF6',
          orange: '#F97316',
          teal: '#14B8A6',
        },
      },
      boxShadow: {
        // Premium shadow system - softer, more diffused
        'xs': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',

        // Elevation system
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'elevation-2': '0 3px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'elevation-3': '0 6px 12px rgba(0, 0, 0, 0.06), 0 3px 6px rgba(0, 0, 0, 0.03)',
        'elevation-4': '0 12px 24px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.04)',

        // Glow effects for focus states
        'glow-blue': '0 0 0 3px rgba(0, 102, 255, 0.12)',
        'glow-green': '0 0 0 3px rgba(0, 200, 83, 0.12)',
        'glow-red': '0 0 0 3px rgba(255, 59, 48, 0.12)',

        // Card shadows
        'card': '0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 8px 25px rgba(0, 0, 0, 0.08), 0 3px 10px rgba(0, 0, 0, 0.04)',

        // Inner shadows
        'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '128': '32rem',
        '144': '36rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem', { lineHeight: '2rem' }],
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '5xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-gentle': 'bounce-gentle 0.5s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        'slide-up': {
          'from': { transform: 'translateY(16px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          'from': { transform: 'translateY(-16px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
export default config
