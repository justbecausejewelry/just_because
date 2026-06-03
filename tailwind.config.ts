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
        sans: ['var(--font-jost)', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-jost)', 'sans-serif'],
        script: ['var(--font-italianno)', 'cursive'],
        cormorant: ['var(--font-cormorant)', 'serif'],
        jost: ['var(--font-jost)', 'sans-serif'],
        italianno: ['var(--font-italianno)', 'cursive'],
      },
      fontSize: {
        display: ['clamp(4rem, 9vw, 8rem)', { lineHeight: '0.95' }],
        hero: ['clamp(3rem, 6vw, 5rem)', { lineHeight: '1.1' }],
        title: ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1' }],
        heading: ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.15' }],
        subhead: ['1.5rem', { lineHeight: '1.3' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.8' }],
        body: ['1rem', { lineHeight: '1.7' }],
        small: ['0.875rem', { lineHeight: '1.6' }],
        label: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.2em' }],
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
