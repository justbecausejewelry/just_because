import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        verde: {
          cream: '#F4ECE2',
          emerald: '#2D5246',
          gold: '#C9A961',
          ink: '#1A1A14',
          stone: '#B5A88F',
          ivory: '#FFFEFB',
          mist: '#FAF5EE',
          sage: '#E4EDE8',
        },
        success: '#6B7F65',
        error: '#A85C3C',
        'verde-border': '#E8DFD2',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        script: ['var(--font-italianno)', 'cursive'],
      },
      letterSpacing: {
        eyebrow: '0.3em',
        button: '0.18em',
        nav: '0.08em',
      },
      boxShadow: {
        card: '0 4px 20px rgba(45,82,70,0.06)',
        'card-hover': '0 8px 32px rgba(45,82,70,0.1)',
      },
    },
  },
  plugins: [],
}

export default config
