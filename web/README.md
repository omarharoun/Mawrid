 ## Next.js + Supabase starter (Vercel-ready)
 
 - **Framework**: Next.js App Router (v14)
 - **Auth/DB**: Supabase (`@supabase/ssr`)
 - **Styling**: Tailwind CSS
 
 ### Setup
 1. Copy envs
 
 ```bash
 cp .env.example .env.local
 ```
 
 2. Create a Supabase project and set envs in `.env.local`:
 - `NEXT_PUBLIC_SUPABASE_URL`
 - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 - optional: `NEXT_PUBLIC_SITE_URL`
 
 3. Install & run
 
 ```bash
 pnpm install
 pnpm dev
 ```
 
 ### Deploy to Vercel
 - Push this folder and import the repo in Vercel.
 - Set the same env vars in Vercel Project Settings → Environment Variables.
 - Framework preset: Next.js.
 - If this repo has other code at the root, set Project → Settings → General → Root Directory to `web/`.
 
 ### Structure
 - `src/app` – App Router pages
 - `src/lib/supabase` – client/server helpers
 - `src/middleware.ts` – protects `/account` routes
 
 ### Auth
 - `GET /login` – email/password login (adjust for your flow)
 - `POST /auth/sign-out` – signs out and redirects to `/`
