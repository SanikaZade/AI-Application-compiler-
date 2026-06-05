/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        compiler: {
          purple: {
            DEFAULT: '#7c3aed',
            light: '#f5f3ff',
            dark: '#6d28d9',
            glow: '#a78bfa'
          },
          slate: {
            light: '#f8fafc',
            border: '#e2e8f0',
            text: '#334155'
          },
          emerald: '#10b981',
          rose: '#ef4444',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(124, 58, 237, 0.08), 0 2px 8px -1px rgba(124, 58, 237, 0.04)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.25)',
        'glow-purple-strong': '0 0 30px rgba(124, 58, 237, 0.4)'
      }
    },
  },
  plugins: [],
}

