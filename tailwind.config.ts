import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        lumiere: {
          pearl: '#FBF5F0',
          gold: '#C9A961',
          blush: '#E8C4D0',
          noir: '#1A1014',
          taupe: '#B8A090',
          ivory: '#FDF8F2',
          petal: '#FCF0F4',
          rose: '#F5E8ED',
          goldtint: '#EDD9AF',
        },
        success: '#7A8F72',
        error: '#A85C6A',
        'lumiere-border': '#EDD9AF',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        script: ['var(--font-italianno)', 'cursive'],
      },
      letterSpacing: { eyebrow: '0.3em', button: '0.18em', nav: '0.08em' },
      boxShadow: {
        card: '0 4px 20px rgba(26,16,20,0.06)',
        'card-hover': '0 8px 32px rgba(26,16,20,0.10)',
      },
    },
  },
  plugins: [],
}
export default config