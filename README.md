# Ashfall Collective MVP

Ashfall Collective is a solo-first murder mystery web app with in-universe Ashfall agency framing, a dossier vault, investigation workspaces, draft persistence, graded submissions, and debrief flows.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a local env file from `.env.example`.
3. Set `NEXTAUTH_SECRET` to any non-empty local secret.
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

- Local development and tests use embedded `PGlite` data under `/.data/pglite`.
- Case content lives in `content/cases/*` and is synced into `case_definitions` by the seed runner and the runtime manifest sync path.
- Returning-agent auth uses NextAuth credentials. Signup also sets the local Ashfall agent cookie so the MVP flow works before a full session-management pass.

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
