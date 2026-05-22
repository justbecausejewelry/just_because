# Codex Instructions for "Just Because" Project

## Project briefing
This is a luxury lab-grown diamond jewelry website prototype called **Just Because**.

Before doing ANYTHING in this project, **read the file `PROJECT_CONTEXT.md`** in the project root. It contains the complete brief including:
- Tech stack decisions (locked)
- Verde color palette (locked)
- Typography system
- Page structure and folder structure
- Brand voice and design principles
- Product customization options
- Sample data and naming conventions


## Critical rules

1. **This is a LOCAL PROTOTYPE only.** No real payments, no real authentication, no live hosting. Everything runs on localhost:3000.

2. **Tech stack is LOCKED.** Do not propose alternatives:
   - Next.js 15 (App Router)
   - TypeScript (strict mode, no `any` types)
   - Tailwind CSS
   - shadcn/ui (New York style, Neutral base)
   - Framer Motion (subtle animations only)
   - Lucide React (icons)

3. **Brand palette is LOCKED.** Use ONLY the Verde palette:
   - Cream `#F4ECE2` (primary background)
   - Deep Emerald `#2D5246` (primary accent)
   - Champagne Gold `#C9A961` (metallic decorative)
   - Velvet Ink `#1A1A14` (text)
   - Warm Stone `#B5A88F` (secondary text)
   - Plus supporting tones defined in PROJECT_CONTEXT.md

4. **Typography is LOCKED.** Playfair Display (serif headings) + Inter (sans-serif body) loaded via `next/font/google`. Optional script font for logo: Italianno or Pinyon Script.

5. **Always show your plan BEFORE executing.** Never make code changes without telling me what you'll do first. Wait for approval.

6. **Build in phases.** Complete one phase at a time. Wait for me to say "proceed" before starting the next phase.

7. **Create git commits at meaningful checkpoints.** After each major feature or phase, commit with a clear message.

8. **Every component must be responsive.** Design mobile-first, then enhance for tablet (768px+) and desktop (1024px+).

9. **Use Server Components by default.** Only add `"use client"` directive when the component genuinely needs interactivity (forms, state, animations, event handlers).

10. **Reference PROJECT_CONTEXT.md** for any decisions about palette, fonts, structure, naming, or data shape. Never guess.

## Working style

- Plan first, code second.
- Show diffs before applying changes.
- One phase at a time.
- If uncertain, ask before assuming.
- Use TypeScript strict mode — never use `any`.
- Prefer composition over duplication — build small reusable components.
- Keep components under 200 lines when possible — split if larger.

## What NOT to do

- Do not install packages outside the locked tech stack without asking.
- Do not deviate from the Verde palette colors.
- Do not use emojis in UI (use Lucide icons instead).
- Do not use pure white `#FFFFFF` or pure black `#000000` anywhere.
- Do not use border-radius values larger than 8px (luxury = sharp corners).
- Do not skip reading PROJECT_CONTEXT.md before making decisions.

## Current phase

The project starts at **Phase 1: Project Initialization**. Do not jump ahead to building pages or components until I explicitly approve moving past Phase 1.
