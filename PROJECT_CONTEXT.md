# JUST BECAUSE — PROJECT CONTEXT

> **Last updated:** May 21, 2026
> **Status:** Local prototype phase
> **Read this before making any decisions about this project.**

---

## SECTION 1: PROJECT OVERVIEW

**Brand Name:** Just Because
**Tagline:** "A reason, in itself."
**Product Category:** Lab-grown diamond jewelry (rings, earrings, necklaces, bracelets, gifts)

**Brand Positioning:**
Warm, emotional, spontaneous luxury — diamonds for moments that don't need an occasion. Differentiates from competitors who focus on milestones (engagements, anniversaries) by owning the "everyday romance / self-gifting / no-reason" emotional territory.

**Competitor reference brands studied:**
- Grown Brilliance (closest direct competitor, lab-grown focused)
- VRAI (minimalist/modern aesthetic)
- Brilliant Earth (ethical/premium)
- Mejuri (everyday luxury)
- Tiffany & Co (heritage luxury benchmark)
- Cartier (heritage maximalist benchmark)

**Current stage:**
Building a LOCAL PROTOTYPE only. No live hosting yet. No real payments. No real authentication. Just a beautiful, fully functional design running on localhost:3000.

**Phase 2 (future, not now):**
Production deployment with real auth (Clerk), real payments (Stripe), real hosting (Vercel), real image storage (Hostinger).

---

## SECTION 2: TECH STACK (LOCKED — DO NOT DEVIATE)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode, no `any` types) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (New York style, Neutral base, CSS variables) |
| Animations | Framer Motion (subtle, 400-600ms transitions) |
| Icons | Lucide React |
| Database (Phase 2) | PostgreSQL with Prisma ORM |
| Authentication (prototype) | Mock auth only |
| Authentication (Phase 2) | Clerk |
| Payments (prototype) | Fake "Place Order" button only |
| Payments (Phase 2) | Stripe (regular Stripe, NOT Stripe Connect) |
| Images (prototype) | Local `/public/images/` folder |
| Images (Phase 2) | Hostinger |
| Email (prototype) | console.log only |
| Email (Phase 2) | Resend |
| Hosting (prototype) | localhost:3000 |
| Hosting (Phase 2) | Vercel |
| Code editor | VS Code with Codex extension |
| Version control | Git + GitHub |

**Fonts (loaded via `next/font/google`):**
- Headings: **Playfair Display** (serif)
- Body: **Inter** (sans-serif)
- Script accent (logo only): **Italianno** or **Pinyon Script**

---

## SECTION 3: BRAND COLOR PALETTE — "VERDE" (LOCKED)

This palette was chosen after deep research comparing 6 competitor palettes. The strategic logic: most lab-grown brands use cream + brown + gold (undifferentiated). Verde uses botanical emerald to visually reinforce the "lab-GROWN" story — green = cultivated, considered, naturally created.

### Hero palette (5 colors)

| Role | Name | Hex | Tailwind token |
|---|---|---|---|
| Primary background | Cream | `#F4ECE2` | `verde-cream` |
| Primary accent | Deep Emerald | `#2D5246` | `verde-emerald` |
| Metallic accent | Champagne Gold | `#C9A961` | `verde-gold` |
| Primary text | Velvet Ink | `#1A1A14` | `verde-ink` |
| Secondary text | Warm Stone | `#B5A88F` | `verde-stone` |

### Supporting palette (4 colors)

| Role | Name | Hex | Tailwind token |
|---|---|---|---|
| Elevated card white | Ivory | `#FFFEFB` | `verde-ivory` |
| Alternating section | Mist | `#FAF5EE` | `verde-mist` |
| Highlight section | Sage Tint | `#E4EDE8` | `verde-sage` |
| Dark hero/footer | Velvet | `#1A1A14` | `verde-velvet` |

### Functional colors

| Role | Hex |
|---|---|
| Success | `#6B7F65` (muted sage) |
| Error | `#A85C3C` (warm rust, not red) |
| Border | `#E8DFD2` (soft linen) |
| Disabled | `#D4CFC6` |
| Border on emerald | `rgba(45,82,70,0.12)` |

### Color usage rules

1. **Cream (`#F4ECE2`) is the dominant background** — 60% of any page
2. **Deep emerald (`#2D5246`) is the signature accent** — appears MAX 3-4 times per page (top bar, one CTA, video section, decorative lines)
3. **Champagne gold (`#C9A961`) is for metallic-decorative touches only** (stars, dots, decorative lines, badge accents) — never for primary buttons or large fills
4. **Never use pure white `#FFFFFF`** — always use ivory `#FFFEFB` or cream `#F4ECE2`
5. **Never use pure black `#000000`** — always use velvet ink `#1A1A14`
6. **Three subtle background tones** (`#F4ECE2`, `#FAF5EE`, `#E4EDE8`) create visual rhythm across page sections

---

## SECTION 4: TYPOGRAPHY SYSTEM

### Font families

```ts
// Loaded in src/app/layout.tsx via next/font/google
- Display/Headings: 'Playfair Display', serif
- Body: 'Inter', sans-serif
- Script accent (logo only): 'Italianno' or 'Pinyon Script', cursive
```

### Sizing scale (desktop)

| Element | Size | Font | Line height |
|---|---|---|---|
| Hero headline (H1) | 38-48px | Playfair Display Regular | 1.05 |
| Section title (H2) | 22-28px | Playfair Display Regular | 1.1 |
| Card / Product title | 14-16px | Playfair Display Regular | 1.3 |
| Body text | 12-14px | Inter Regular | 1.6 |
| Small caption | 10-11px | Inter Regular | 1.5 |
| Navigation | 11px | Inter Medium | 1.2 |
| Buttons | 10-11px | Inter Medium | 1.2 |
| Section eyebrow label | 9-10px | Inter Medium | 1.2 |

### Letter-spacing rules

- Section eyebrow labels: `letter-spacing: 0.3em` (e.g., "SHOP BY SHAPE")
- Button text: `letter-spacing: 0.18em`
- Navigation links: `letter-spacing: 0.08em`
- Eyebrow color: always `verde-emerald` (#2D5246)

### Logo treatment

`just` in script italic (Italianno/Pinyon) + `BECAUSE` in letter-spaced sans-serif. Color: `verde-emerald` (#2D5246).

### Casing rules

- Headlines: **Sentence case** (e.g., "Find your diamond's silhouette")
- Section eyebrows: **ALL CAPS** with letter-spacing (e.g., "SHOP BY SHAPE")
- Navigation: **Sentence case**
- Buttons: **Sentence case** OR **Title Case** with letter-spacing
- Body: **Sentence case**

---

## SECTION 5: DESIGN PRINCIPLES

1. **Whitespace > content.** Section padding 80-120px desktop, 40-60px mobile.
2. **Sharp corners** (0-4px border-radius) — luxury editorial feel, no playful rounded UIs.
3. **Borders are 0.5px** — never thick. Use `#E8DFD2` (soft linen).
4. **Shadows are soft and warm** — `0 4px 20px rgba(45,82,70,0.06)` for cards.
5. **Animations are slow** (400-600ms) with `cubic-bezier(0.4, 0, 0.2, 1)`.
6. **Two font weights only**: 400 regular and 500 medium.
7. **Diamond shape icons are line art** — not photos. They become brand assets.
8. **Three background tones layered** for vertical rhythm.
9. **Generous line-height**: 1.6 for body, 1.05-1.1 for headlines.
10. **Editorial > playful.** Think Vogue, not Mailchimp.

---

## SECTION 6: PRODUCT CUSTOMIZATION OPTIONS

### Metal options (for all rings/jewelry)

- White Gold (silver swatch)
- Yellow Gold (gold swatch)
- Rose Gold (pink swatch)
- Platinum (light grey swatch)

### Carat options for engagement rings

| Carat | Price modifier |
|---|---|
| 6 ct | base price |
| 9 ct | base price + $3,000 |
| 12 ct | base price + $7,000 |

### Diamond shapes (9 total)

Round, Oval, Cushion, Emerald, Princess, Pear, Marquise, Asscher, Heart

### Tennis bracelet sizing

- Petite, Medium, Large, Extra Large
- Chain length options: 6", 6.5", 7", 7.5", 8"

### Ring sizes

4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9

### Engraving

Optional text input, max 20 characters

### Price logic

```
- White Gold = base price
- Yellow Gold = base + $200
- Rose Gold = base + $150
- Platinum = base + $800
```

**Price must update LIVE as user changes options (no page refresh).**

---

## SECTION 7: SITE STRUCTURE & PAGES

Build in this exact order:

### 1. Homepage (`/`)

- Top promo bar (phone + signup offer + free shipping)
- Navigation: Engagement Rings, Rings, Earrings, Necklaces, Bracelets, Diamonds, Gifts
- Hero: "Design Your Ring" + Ultra HD photo + two CTAs (Shop / Build)
- Shop by Shape (9 diamond shapes as line-art icons)
- Categories (Rings, Bracelets, Necklaces, Shop All)
- Video section ("This is the future of jewelry" — dark emerald background)
- Best Sellers (5 product cards in a row)
- Reviews (3 testimonial cards + 4.9★ aggregate)
- Footer (4 columns + trust seals)

### 2. Product Listing Page (`/products` or `/[category]`)

- Left sidebar filters (category, metal, shape, carat, price, sort)
- Product grid (3 columns desktop, 2 tablet, 1 mobile)
- Active filter tags + product count

### 3. Product Detail Page (`/products/[slug]`)

- Left: image gallery with thumbnails
- Right: customizer (metal swatches, carat selector, shape selector, ring size, engraving, Add to Cart)
- Live price calculation
- IGI certified badge
- Description tabs + "Complete the Look" recommendations + reviews

### 4. Ring Builder (`/build`)

3-step flow:
- Step 1: Choose Your Setting
- Step 2: Choose Your Diamond
- Step 3: Review & Customize
- Progress indicator at top

### 5. Cart Page (`/cart`)

- Item list + order summary panel + proceed to checkout button

### 6. Checkout Page (`/checkout`) — FAKE for prototype

- Contact info → shipping address → fake payment form → Place Order button

### 7. Order Confirmation (`/order-confirmed`)

- Animated checkmark + fake order number + summary

### 8. Admin Panel (`/admin`) — no login required for prototype

- Dashboard with fake stats
- Products CRUD with image upload
- Orders table with status workflow

---

## SECTION 8: COMPLETE FOLDER STRUCTURE

```
src/
├── app/
│   ├── page.tsx                    # homepage
│   ├── layout.tsx                  # root layout with fonts
│   ├── globals.css
│   ├── products/
│   │   ├── page.tsx                # product listing
│   │   └── [slug]/
│   │       └── page.tsx            # product detail
│   ├── build/
│   │   └── page.tsx                # ring builder
│   ├── cart/
│   │   └── page.tsx                # cart
│   ├── checkout/
│   │   └── page.tsx                # fake checkout
│   ├── order-confirmed/
│   │   └── page.tsx                # confirmation
│   └── admin/
│       └── page.tsx                # admin panel
├── components/
│   ├── layout/
│   │   ├── PromoBar.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── ShopByShape.tsx
│   │   ├── Categories.tsx
│   │   ├── VideoStory.tsx
│   │   ├── BestSellers.tsx
│   │   └── Reviews.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductCustomizer.tsx
│   │   ├── MetalSelector.tsx
│   │   ├── CaratSelector.tsx
│   │   ├── ShapeSelector.tsx
│   │   └── ImageGallery.tsx
│   ├── builder/
│   │   ├── BuilderStepper.tsx
│   │   ├── SettingSelector.tsx
│   │   ├── DiamondSelector.tsx
│   │   └── BuilderReview.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── OrderSummary.tsx
│   └── ui/                         # shadcn components
├── lib/
│   ├── utils.ts                    # cn helper
│   ├── data/
│   │   ├── products.ts             # fake product data
│   │   ├── diamonds.ts             # fake diamond data
│   │   └── reviews.ts              # fake reviews
│   └── constants/
│       ├── colors.ts               # Verde palette constants
│       └── shapes.ts               # diamond shape definitions
└── types/
    └── index.ts                    # TypeScript interfaces
```

---

## SECTION 9: SAMPLE PRODUCT NAMES

Use elegant, French/celestial-sounding names:

### Rings

- **Solis** (sun) — Round solitaire
- **Vela** (sail) — Oval solitaire
- **Lumi** (light) — Cushion halo
- **Orla** (golden) — Marquise
- **Coeur** (heart) — Heart cut
- **Etoile** (star) — Three-stone
- **Astra** (star) — Pavé band
- **Soleil** (sun) — Emerald cut
- **Rune** — Vintage filigree
- **Halo** — Halo design

### Bracelets

- Continuum Tennis
- Stella Bangle
- Ligne Cuff
- Maritime Anchor Chain
- Aurora Pavé

### Necklaces

- Solène Pendant
- Petit Diamant
- Constellation Strand
- Drop of Light
- Initial Charm

---

## SECTION 10: TAILWIND CONFIG (READY TO USE)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
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
          velvet: '#1A1A14',
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
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      boxShadow: {
        card: '0 4px 20px rgba(45,82,70,0.06)',
        'card-hover': '0 8px 32px rgba(45,82,70,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## SECTION 11: BUILD PHASES

### Phase 1 — Project Initialization ⏳ START HERE

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --no-import-alias` (dot installs in current directory)
2. Install additional packages: `npm install framer-motion lucide-react`
3. Initialize shadcn/ui: `npx shadcn@latest init` (New York style, Neutral base, CSS variables yes)
4. Install shadcn components: `npx shadcn@latest add button card dialog sheet tabs select slider badge separator accordion toast input label`
5. Configure Tailwind with the Verde palette (Section 10 has exact config)
6. Set up `next/font/google` for Playfair Display + Inter in `src/app/layout.tsx`
7. Verify `npm run dev` works at localhost:3000

### Phase 2 — Homepage Build

- Create all components in `src/components/layout/` and `src/components/home/`
- Build the homepage as designed in our mockup
- Use fake data from `src/lib/data/`

### Phase 3 — Product Pages

- Product listing with filters
- Product detail with full customizer
- Live price calculation

### Phase 4 — Ring Builder

- 3-step flow with state management
- Composite preview of setting + diamond

### Phase 5 — Cart + Checkout + Confirmation

- LocalStorage-based cart
- Fake checkout flow
- Confirmation page

### Phase 6 — Admin Panel

- Dashboard
- Product CRUD
- Orders table

### Phase 7 — Polish

- Responsive design audit
- Framer Motion animations
- Loading states and empty states
- Final review

---

## SECTION 12: WHAT IS LOCKED VS. WHAT NEEDS DECIDING

### Locked (do not re-debate)

- Tech stack (Next.js, TypeScript, Tailwind, shadcn)
- Verde color palette
- Typography system
- Page structure
- Folder structure
- Local-only prototype scope (no real payments / auth / hosting)

### Still to decide (per page when we get to it)

- Final logo treatment (script-only vs. wordmark)
- Hero headline copy ("A reason, in itself." is current pick)
- Mobile responsive breakpoints (768px tablet, 1024px desktop is default)
- Specific Framer Motion animations per component
- Photography sourcing (Unsplash placeholders for prototype)
- 360° video integration (deferred to production phase)

---

## END OF CONTEXT FILE

If you're an AI assistant reading this: please confirm you've understood by answering these 4 questions before making any changes to the project:

1. What is the brand name and current tagline?
2. What are the 5 hero palette colors with their hex codes?
3. What is the complete tech stack?
4. Which page is being built first, and what are its main sections?
