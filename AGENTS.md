# AGENTS.md: QuizWarp frontend

Next.js app for QuizWarp, an AI quiz generation and gamified assessment platform. This repo is the **frontend only**. The Python AI service lives in a separate repo (`Adrian7373/backend`, see "Backend contract").

## Deployment

- **Frontend (this repo):** Vercel.
- **Backend:** Render web service (Flask + gunicorn). Separate GitHub repo.
- Database: PostgreSQL (Supabase) via Prisma. Auth: Supabase.

## Stack

Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, Prisma 7 (`@prisma/adapter-pg`), Supabase (`@supabase/ssr`), TypeScript.

Next.js 16 differs from older versions you may know. Request interception is `src/proxy.ts` (formerly `middleware.ts`). When unsure about an API, check `node_modules/next/dist/docs/` or the official docs rather than guessing from memory.

## Commands

```bash
npm install
npm run dev -- -p 3000    # dev server (port 3000 is the project default)
npm run lint
npm run build             # runs `prisma generate` first
npm run db:generate       # regenerate the Prisma client
```

There is no test runner. **Before finishing any change, run `npm run lint` and `npm run build` and fix what they report.** If a command can't run, say so rather than claiming success.

## Setup in a fresh checkout or worktree

1. `npm install`
2. Copy `.env` from another checkout (it is gitignored). Never print or commit its values.
3. `npm run db:generate`. The Prisma client is generated into `src/generated/prisma` and is **not tracked in git**. Without it every page returns 500 with "Can't resolve '@/generated/prisma/client'".

Required env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `PYTHON_AI_URL`. Missing Supabase vars cause a 500 from `src/proxy.ts`.

## Layout

```text
src/app/            routes (App Router)
  actions.ts        core server actions: quizzes, sessions, grading
  actions/          more server actions (generate.ts calls the AI service)
  _components/      shared UI
  dashboard/ host/ play/ quiz/ study/ join/ login/ signup/ auth/ api/
src/lib/            prisma.ts, prisma-connection.ts
src/utils/supabase/ browser and server Supabase clients
src/proxy.ts        Supabase session refresh
prisma/             schema.prisma, migrations/, seed.ts
```

## Conventions

- Use the `@/` import alias for `src/`.
- Business logic lives in server actions, not in client components. Keep secrets and DB access server-side.
- Reuse `src/lib/prisma.ts` for the Prisma client and `src/utils/supabase/*` for Supabase. Don't create new clients.
- Only `NEXT_PUBLIC_*` variables may reach the browser. Never expose `DATABASE_URL`, service keys, or the AI service key to client code.
- Match the existing Tailwind and component style. Don't add a dependency for something the stack already does.

## Database rules (Prisma + Supabase)

- You may edit `prisma/schema.prisma` and add migration files.
- **Ask before** running `prisma db push`, `prisma migrate dev/deploy`, `db:seed`, or anything that writes to the live database. The `.env` points at a real database.
- Never delete or rewrite existing migrations or user data without asking.
- After schema changes, run `npm run db:generate`.

## Backend contract

The frontend calls the Flask service at `PYTHON_AI_URL` (default `http://127.0.0.1:5000`) from server actions (`src/app/actions/generate.ts`, `src/app/actions.ts`):

- `POST /api/generate`: generate quiz questions
- `POST /api/insights`: AI class insights
- `POST /api/grade-answer`: grade essay answers

If you change a request or response shape here, the backend repo must change too (and the reverse). Say so explicitly in your summary and in the PR. On Vercel, `PYTHON_AI_URL` must point at the Render URL. Render free instances sleep, so the first call can be slow or time out; handle that gracefully.

## Safety

- Don't commit `.env` or secrets. Don't run destructive git commands (force push, hard reset) without asking.
- Don't change Vercel or Render settings, auth providers, or OAuth redirect URLs. Tell the user what needs changing instead.
- Don't commit or push unless asked.
