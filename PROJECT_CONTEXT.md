# JUST BECAUSE — PROJECT CONTEXT
> Last updated: May 22, 2026 | Palette: Lumière (switched from Verde)
> Read this before making ANY decision about this project.

---

## SECTION 1: PROJECT OVERVIEW

**Brand:** Just Because
**Tagline:** "A reason, in itself."
**Product:** Lab-grown diamond jewelry (rings, earrings, necklaces, bracelets, gifts)

**Positioning:** Warm, emotional, spontaneous luxury. Diamonds for moments that
don't need an occasion. Only lab-grown brand owning "everyday romance /
self-gifting / no-reason" territory.

**Stage:** LOCAL PROTOTYPE only. localhost:3000. No real payments, auth, or hosting.
**Phase 2 (future):** Clerk auth, Stripe payments, Vercel hosting, Hostinger images.

---

## SECTION 2: TECH STACK (LOCKED)

| Layer            | Choice                                      |
|------------------|---------------------------------------------|
| Framework        | Next.js 15 (App Router)                     |
| Language         | TypeScript (strict, no any)                 |
| Styling          | Tailwind CSS                                |
| UI Components    | shadcn/ui (New York, Neutral, CSS variables)|
| Animations       | Framer Motion (400-600ms, subtle only)      |
| Icons            | Lucide React                                |
| Database (P2)    | PostgreSQL + Prisma ORM                     |
| Auth (prototype) | Mock login only                             |
| Auth (P2)        | Clerk                                       |
| Payments (proto) | Fake "Place Order" button                   |
| Payments (P2)    | Stripe (regular, NOT Connect)               |
| Images (proto)   | /public/images/ local folder                |
| Images (P2)      | Hostinger                                   |
| Email (proto)    | console.log only                            |
| Email (P2)       | Resend + React Email                        |
| Hosting (proto)  | localhost:3000                              |
| Hosting (P2)     | Vercel                                      |
| Editor           | VS Code + Codex extension                   |
| Version control  | Git (user: Ujjwal Bana, ujjwalbana@gmail.com)|

**Fonts (next/font/google):**
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)
- Logo script: Italianno

---

## SECTION 3: COLOR PALETTE — "LUMIÈRE" (LOCKED)

Switched from Verde (botanical emerald) to Lumière (gold + champagne + blush pink).
Strategic reason: 2026 jewelry trends confirm champagne gold + rose + blush as the
dominant luxury direction. More romantic, more gift-oriented, warmer feel.
Aligned with brand positioning of spontaneous everyday romance.

### Hero palette (5 colors)

| Name            | Hex      | Tailwind token    | Role                          |
|-----------------|----------|-------------------|-------------------------------|
| Pearl White     | #FBF5F0  | lumiere-pearl     | Primary background (60%)      |
| Champagne Gold  | #C9A961  | lumiere-gold      | Primary accent, logo, badges  |
| Blush Pink      | #E8C4D0  | lumiere-blush     | Signature romantic (max 3/pg) |
| Velvet Noir     | #1A1014  | lumiere-noir      | All text, dark sections       |
| Warm Taupe      | #B8A090  | lumiere-taupe     | Secondary text, captions      |

### Supporting palette (4 colors)

| Name        | Hex      | Tailwind token    | Use                           |
|-------------|----------|-------------------|-------------------------------|
| Warm Ivory  | #FDF8F2  | lumiere-ivory     | Card backgrounds              |
| Petal Tint  | #FCF0F4  | lumiere-petal     | Soft section backgrounds      |
| Rose Mist   | #F5E8ED  | lumiere-rose      | Alternating sections          |
| Gold Tint   | #EDD9AF  | lumiere-goldtint  | Borders, decorative lines     |

### Dark palette (for hero sections, footer, video section)

| Name          | Hex      | Use                                    |
|---------------|----------|----------------------------------------|
| Velvet Noir   | #1A1014  | Dark backgrounds                       |
| Deep Noir     | #2A1E24  | Cards on dark backgrounds              |

### Color usage rules

1. Pearl White #FBF5F0 is the dominant background — 60% of every page
2. Champagne Gold #C9A961 appears in logo, eyebrow labels, badges, star ratings,
   decorative lines — never as large fills or primary buttons
3. Blush Pink #E8C4D0 is the emotional signature — MAX 3 appearances per page.
   Use for: wishlist hearts, "Just Because" category tags, hover accents on CTAs
4. Velvet Noir #1A1014 for ALL text (never pure black #000000)
5. Warm Taupe #B8A090 for secondary text, captions, descriptions
6. Gold Tint #EDD9AF for borders (replaces generic gray borders everywhere)
7. Three background tones layer for rhythm: #FBF5F0 → #FCF0F4 → #F5E8ED
8. On dark sections: Gold #C9A961 and Blush #E8C4D0 both glow beautifully

### Tailwind config (Section 10 below has full code)

---

## SECTION 4: TYPOGRAPHY

| Element              | Font             | Size (desktop) | Weight |
|----------------------|------------------|----------------|--------|
| Hero headline (H1)   | Playfair Display | 38-48px        | 400    |
| Section title (H2)   | Playfair Display | 22-28px        | 400    |
| Card/product title   | Playfair Display | 14-16px        | 400    |
| Body text            | Inter            | 12-14px        | 400    |
| Small caption        | Inter            | 10-11px        | 400    |
| Navigation           | Inter            | 11px           | 500    |
| Buttons              | Inter            | 10-11px        | 500    |
| Section eyebrow      | Inter            | 9-10px         | 500    |

**Letter-spacing:**
- Eyebrow labels: 0.3em + ALL CAPS + color #C9A961
- Buttons: 0.18em
- Navigation: 0.08em

**Logo:** "just" in Italianno italic (24px, #C9A961) + "BECAUSE" in Inter (14px,
letter-spacing 0.25em, #1A1014 or #FBF5F0 on dark)

---

## SECTION 5: DESIGN PRINCIPLES

1. Whitespace is luxury — 80-120px section padding desktop, 40-60px mobile
2. Sharp corners 0-4px border-radius — editorial, never playful
3. Borders: 0.5px solid #EDD9AF (gold tint) — never thick, never gray
4. Shadows: 0 4px 20px rgba(26,16,20,0.06) for cards
5. Animations: 400-600ms, cubic-bezier(0.4, 0, 0.2, 1) — silky not bouncy
6. Font weights: 400 and 500 only — never 600 or 700
7. Diamond shapes: custom SVG line-art icons — brand assets, not photos
8. Photography backgrounds: always Pearl White or Warm Ivory — never pure white
9. Think Vogue editorial meets romantic Parisian boutique

---

## SECTION 6: PRODUCT OPTIONS

### Metal options
- White Gold (swatch: silver #E8E8E8) → base price
- Yellow Gold (swatch: gold #C9A961) → base + $200
- Rose Gold (swatch: blush #E8B5A8) → base + $150 ← FEELS NATIVE TO THIS PALETTE
- Platinum (swatch: light grey #D8D8D8) → base + $800

### Carat options
- 6 ct → base price
- 9 ct → base + $3,000
- 12 ct → base + $7,000
Price updates LIVE as user changes options (no page refresh).

### Diamond shapes (9)
Round, Oval, Cushion, Emerald, Princess, Pear, Marquise, Asscher, Heart

### Other options
- Ring sizes: 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
- Engraving: optional, max 20 characters
- Bracelet sizes: Petite, Medium, Large, Extra Large
- Chain lengths: 6", 6.5", 7", 7.5", 8"

---

## SECTION 7: PAGES (build in this order)

1. **Homepage (/)** — PromoBar, Navbar, Hero, ShopByShape, Categories,
   VideoStory, BestSellers, Reviews, Footer

2. **Product Listing (/products)** — sidebar filters, product grid, active tags

3. **Product Detail (/products/[slug])** — gallery, customizer, live pricing,
   certifications, reviews, recommendations

4. **Ring Builder (/build)** — 3 steps: setting → diamond → review

5. **Cart (/cart)** — line items, order summary

6. **Checkout (/checkout)** — FAKE: contact → shipping → payment → "Place Order"

7. **Order Confirmation (/order-confirmed)** — animated checkmark, fake order number

8. **Admin Panel (/admin)** — no login, dashboard, products CRUD, orders table

---

## SECTION 8: HOMEPAGE COMPONENT SPECS

### PromoBar (src/components/layout/PromoBar.tsx)
- Background: Velvet Noir #1A1014
- Left: phone +91 91284 87999 (taupe text)
- Center: "Sign up and receive 30% off your first piece" (gold #C9A961, bold)
- Right: "Free shipping over $200" (taupe text)
- Font: Inter 10px

### Navbar (src/components/layout/Navbar.tsx)
- Background: Pearl White #FBF5F0
- Border bottom: 0.5px solid #EDD9AF
- Logo left: "just" Italianno italic 22px gold + "BECAUSE" Inter tracked noir
- Nav center: Engagement rings, Rings, Earrings, Necklaces, Bracelets, Diamonds, Gifts
- Icons right: Search, Account, Heart (wishlist), Cart (with blush badge count)
- Sticky on scroll

### Hero (src/components/home/Hero.tsx)
- Background: Pearl White #FBF5F0
- Left: eyebrow "DESIGN YOUR RING" (gold), headline "A reason," + italic blush
  "in itself." (Playfair 48px noir), subtext, two CTAs
- CTA 1: "Shop the collection" — Velvet Noir background, Pearl White text
- CTA 2: "Build a ring" — transparent, Gold Tint border, noir text
- Right: image placeholder (Rose Mist #F5E8ED background) + "ULTRA HD" badge

### ShopByShape (src/components/home/ShopByShape.tsx)
- Background: Petal Tint #FCF0F4
- Eyebrow: "SHOP BY SHAPE" (gold)
- Heading: "Find your diamond's silhouette"
- 9 SVG line-art shape icons in a row
- Active/hover: Pearl White bg, Gold Tint border, gold icon stroke
- Click routes to /products?shape=round etc.

### Categories (src/components/home/Categories.tsx)
- 4 cards: Rings, Bracelets, Necklaces, Shop All
- Cards: Warm Ivory bg, Gold Tint border, serif name, taupe price, gold count badge
- "Shop All" card: Velvet Noir bg, gold accent, Pearl White text
- Hover: translateY(-6px) lift

### VideoStory (src/components/home/VideoStory.tsx)
- Background: Velvet Noir #1A1014 (full width dark section)
- Left: video placeholder (Deep Noir #2A1E24) + play button in blush
- Right eyebrow: "CULTIVATED, NOT COMPROMISED" (#C9A961 gold)
- Heading: "This is the future of jewelry." (Pearl White, 28px serif)
- Body: lab-grown story paragraph (taupe #B8A090)
- Stats: "0 Mining" / "100% Renewable" / "IGI Certified" — values in gold

### BestSellers (src/components/home/BestSellers.tsx)
- Background: Pearl White #FBF5F0
- Heading + "View all" link (gold)
- 5 product cards: Warm Ivory bg, Gold Tint border
- Badges: "NEW" in gold tint bg + gold text, sale in blush bg + deep pink text
- Hover: secondary image fade

### Reviews (src/components/home/Reviews.tsx)
- Background: Rose Mist #F5E8ED
- 4.9★ aggregate in gold stars
- 3 cards: Pearl White #FBF5F0 bg, Gold Tint border
- Quote in Playfair italic, customer name in taupe

### Footer (src/components/layout/Footer.tsx)
- Background: Velvet Noir #1A1014
- Logo in gold + blush
- 4 columns: logo+social, Shop, Learn, Support (taupe text, gold hover)
- Bottom: copyright + trust seals (IGI Certified, GCAL Verified, Carbon Neutral)
- Social icons in blush pink

---

## SECTION 9: FAKE DATA

**Product names (French/celestial):**
Rings: Solis, Vela, Lumi, Orla, Coeur, Etoile, Astra, Soleil
Bracelets: Continuum Tennis, Stella Bangle, Ligne Cuff
Necklaces: Solène Pendant, Petit Diamant, Constellation Strand
Price range: $980 – $8,900

**Reviews (4.9★, 2,847 reviews):**
1. "I bought this for myself on a Tuesday. No occasion. Just because.
   Best decision of the year." — Priya M., Mumbai
2. "The packaging alone made me cry. The diamond outshines my old one
   and it cost half." — Sarah K., Brooklyn
3. "Felt less like e-commerce, more like a friend." — Aaron L., Toronto

---

## SECTION 10: TAILWIND CONFIG (READY TO USE)

```ts
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
      letterSpacing: {
        eyebrow: '0.3em',
        button: '0.18em',
        nav: '0.08em',
      },
      boxShadow: {
        card: '0 4px 20px rgba(26,16,20,0.06)',
        'card-hover': '0 8px 32px rgba(26,16,20,0.10)',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## SECTION 11: BUILD PHASES

### Phase 1 — COMPLETE ✅
Next.js 15 + TypeScript + Tailwind + shadcn/ui installed.
Fonts loaded (Playfair Display + Inter + Italianno).
Verification page confirmed working at localhost:3000.
Known issue: background shows white not pearl — fix by adding
`body { background-color: #FBF5F0; }` to globals.css

### Phase 2 — IN PROGRESS (Homepage)
Build components in order listed in Section 8.
Assemble in src/app/page.tsx replacing verification page.

### Phase 3 — Product Pages
### Phase 4 — Ring Builder
### Phase 5 — Cart + Checkout + Confirmation
### Phase 6 — Admin Panel
### Phase 7 — Polish + Responsive audit + Animations

---

## SECTION 12: TECHNICAL NOTES

- Tailwind v4 installed — custom classes may not work, use inline styles as fallback:
  style={{backgroundColor: '#FBF5F0'}} instead of className="bg-lumiere-pearl"
- shadcn: using @latest to add components, config locked to new-york/neutral
- PowerShell: always npm.cmd and npx.cmd
- Node.js v22.17.0 installed and working
- Git branch: master | user: Ujjwal Bana <ujjwalbana@gmail.com>
- Project path: D:\LAB_Grown\Just_Becuase

---

## CONFIRMATION QUESTIONS
If you are an AI reading this, answer these before doing anything:
1. What is the brand name and tagline?
2. What are the 5 hero Lumière palette colors with hex codes?
3. What is the background color for the homepage?
4. What component do we build first in Phase 2?
