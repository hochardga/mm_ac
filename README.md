# Ashfall Collective MVP

Ashfall Collective is a solo-first murder mystery web app with in-universe Ashfall agency framing, a dossier vault, investigation workspaces, draft persistence, graded submissions, and debrief flows.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a local env file from `.env.example`.
3. Set `NEXTAUTH_SECRET` to any non-empty local secret.
   No local Postgres server is required; `DATABASE_URL` only exists to satisfy env parsing while the embedded `PGlite` instance handles storage.
4. Seed the three authored case definitions into the embedded local database:

```bash
pnpm db:seed
```

5. Start the app:

```bash
pnpm dev
```

The app runs at [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Operator Notes

- Local development uses embedded `PGlite` data under `/.data/pglite`, while tests run entirely in-memory because `NODE_ENV === "test"` triggers the runtime storage policy's memory branch.
- Case content lives in `content/cases/*` and is synced into `case_definitions` by the seed runner and the runtime manifest sync path.
- Returning-agent auth uses NextAuth credentials. Signup also sets the local Ashfall agent cookie so the MVP flow works before a full session-management pass.

## Vercel Demo Deployment

This app can be deployed on Vercel Hobby as a demo-grade environment.

Required environment variables:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=https://<your-project>.vercel.app` (must match your deployed Vercel hostname so auth callbacks succeed)
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/ashfall_collective` (kept to satisfy env parsing even though PGlite handles storage)

Notes:

- Player data is temporary and may reset after deploys or runtime recycling.
- Case content still comes from `content/cases/*`, and migrations resolve from `process.cwd()/src/db/migrations`, so the repo files must remain available in the deployment bundle.
- `NEXTAUTH_URL` has to remain pointed at the hosted Vercel URL; local values break return redirects in production.
- `DATABASE_URL` is only present to satisfy the existing env parsing, and the Vercel deployment still runs on embedded `PGlite`.
- If file-backed `PGlite` cannot initialize on Vercel, the app should fall back to in-memory demo storage.

## Verification

Run the full automated suite before handing off or merging:

```bash
pnpm vitest
pnpm playwright test
```

## Useful Commands

```bash
pnpm validate:cases
pnpm db:seed
pnpm dev
pnpm vitest
pnpm playwright test
```

## Current Scope

This repo currently covers the Ashfall MVP only: solo case play, strong agency framing, retention-focused flows, and local operator tooling. Subscriptions, multiplayer, and a full authoring CMS remain out of scope.
