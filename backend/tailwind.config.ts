import type { Config } from 'tailwindcss'

// Design tokens mirror the bengkelgearbox.my storefront (assets/shop.css) so the
// owner area and the storefront share one dark navy + cyan system.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds (deep navy)
        night: '#050b1c', // deepest: page base, overlays
        canvas: '#050b1c', // page background
        surface: '#0b1a3a', // card background
        'surface-2': '#102448', // elevated surface
        // Borders (subtle cyan)
        line: 'rgba(52,185,240,0.18)',
        'line-soft': 'rgba(52,185,240,0.10)',
        // Text
        ink: {
          DEFAULT: '#eaf4ff',
          soft: '#c4dcf0',
          muted: '#8ba6c4',
        },
        // Brand (cyan)
        brand: {
          DEFAULT: '#34b9f0',
          dark: '#1f8fc4',
          bright: '#5fd2ff',
          soft: 'rgba(52,185,240,0.12)',
        },
        positive: '#5ad19a',
        warning: '#ffd24a',
        danger: '#ff5b63',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        head: ['var(--font-head)', 'Saira', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
      maxWidth: {
        page: '1180px',
      },
    },
  },
  plugins: [],
}

export default config
