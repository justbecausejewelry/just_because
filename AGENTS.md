# Codex Instructions for "Just Because" Project

## Project briefing
This is a luxury lab-grown diamond jewelry website prototype called **Just Because**.

Before doing ANYTHING in this project, **read PROJECT_CONTEXT.md** in the project root.
It contains the complete brief: tech stack, Lumière palette, typography, pages, structure.

## Critical rules

1. **LOCAL PROTOTYPE ONLY.** No real payments, no real auth, no live hosting. localhost:3000.

2. **Tech stack is LOCKED:**
   - Next.js 15 (App Router)
   - TypeScript (strict, no `any`)
   - Tailwind CSS
   - shadcn/ui (New York style, Neutral base)
   - Framer Motion (subtle animations, 400-600ms)
   - Lucide React (icons)

3. **Lumière palette is LOCKED. Use ONLY these:**
   - Pearl White   #FBF5F0  → primary background (60% of every page)
   - Champagne Gold #C9A961 → primary accent (logo, decorative, badges)
   - Blush Pink    #E8C4D0  → signature romantic accent (max 3x per page)
   - Velvet Noir   #1A1014  → all text + dark sections (never pure #000000)
   - Warm Taupe    #B8A090  → secondary text, captions
   - Warm Ivory    #FDF8F2  → elevated card backgrounds
   - Petal Tint    #FCF0F4  → soft section backgrounds
   - Rose Mist     #F5E8ED  → alternating section backgrounds
   - Gold Tint     #EDD9AF  → decorative highlights, borders
   NEVER use pure white #FFFFFF or pure black #000000 anywhere.

4. **Fonts are LOCKED:**
   - Headings: Playfair Display (serif)
   - Body: Inter (sans-serif)
   - Logo accent: Italianno (script)
   All loaded via next/font/google.

5. **Show plan BEFORE writing code. Wait for approval.**

6. **One phase at a time. Wait for "proceed" before next phase.**

7. **Windows encoding rule — CRITICAL:**
   NEVER use PowerShell Set-Content to write .tsx/.ts files.
   Always write files via VS Code directly or via the Codex extension.
   PowerShell Set-Content causes UTF-16 encoding that breaks Next.js.

8. **PowerShell commands:** always use npm.cmd and npx.cmd (not npm/npx).

9. **Every component must be responsive:** mobile-first, then 768px tablet, 1024px desktop.

10. **Use Server Components by default.** Only add "use client" when truly needed.

## Design principles
- Sharp corners (0-4px border-radius) — luxury editorial feel
- 0.5px borders only, color #EDD9AF (gold tint)
- Slow animations: 400-600ms, cubic-bezier(0.4, 0, 0.2, 1)
- Generous whitespace: 80-120px section padding desktop, 40-60px mobile
- Section eyebrow labels: ALL CAPS, letter-spacing 0.3em, color #C9A961
- Two font weights only: 400 regular, 500 medium
- Think Vogue editorial, not generic e-commerce
- Blush pink #E8C4D0 is the emotional signature — use sparingly so it stays special

## What NOT to do
- Never deviate from the Lumière palette
- Never use pure white #FFFFFF or pure black #000000
- Never install packages outside the locked stack without asking
- Never use border-radius larger than 8px
- Never use PowerShell Set-Content for .tsx/.ts files
