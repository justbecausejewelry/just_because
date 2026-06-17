This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Migrations

NEVER run `ALTER TABLE` / `CREATE TABLE` directly in the Supabase SQL Editor on production. Always:

1. Create a migration: `npx.cmd supabase migration new <name>`
2. Write the SQL in the generated file under `supabase/migrations/`
3. Test locally: `npx.cmd supabase db reset` (resets local DB and replays all migrations from scratch)
4. Apply to prod: `npx.cmd supabase db push`
5. Commit the migration file to git

This guarantees:

- The git repo always reflects the actual DB schema
- Every environment (local, preview, prod) is reproducible
- No silent drift between code and database

For this project, the Supabase project ref is `xayiwdexbykvbvcgudne`. To link a fresh checkout, run:

```bash
npx supabase login
npx supabase link --project-ref xayiwdexbykvbvcgudne
```

Use the database password from Supabase Dashboard -> Settings -> Database when prompted. Local migration reset and schema diff commands require Docker Desktop to be running.
