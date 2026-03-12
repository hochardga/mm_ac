# Ashfall Collective MVP

Ashfall Collective is a solo-first murder mystery web app with in-universe Ashfall agency framing, a dossier vault, investigation workspaces, draft persistence, graded submissions, and debrief flows.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a local env file from `.env.example`.
3. Set `NEXTAUTH_SECRET` to any non-empty local secret.
   No local Postgres server is required; local development defaults to embedded `PGlite` with `DATABASE_DRIVER=pglite`.
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

## Vercel Deployment

Hosted Vercel deployments must use a shared Postgres database. Embedded
`PGlite` remains the default only for local development and tests.

Required environment variables:

- `DATABASE_DRIVER=postgres`
- `DATABASE_URL=<managed postgres url>`
- `NEXTAUTH_SECRET=<secure secret>`
- `NEXTAUTH_URL=https://<your-project>.vercel.app`

Notes:

- Local development still uses `DATABASE_DRIVER=pglite` and does not require a Postgres server.
- Case content still comes from `content/cases/*`, and migrations resolve from `process.cwd()/src/db/migrations`, so the repo files must remain available in the deployment bundle.
- `NEXTAUTH_URL` has to remain pointed at the hosted Vercel URL; local values break return redirects in production.
- Hosted Vercel should fail fast if it is still configured for embedded `PGlite`.
- The deployed host should be smoke-tested after every release.

Post-deploy smoke test:

```bash
PLAYWRIGHT_BASE_URL=https://<your-project>.vercel.app pnpm playwright test tests/e2e/apply.spec.ts tests/e2e/workspace.spec.ts tests/e2e/retention-loop.spec.ts tests/e2e/signin.spec.ts
```

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
