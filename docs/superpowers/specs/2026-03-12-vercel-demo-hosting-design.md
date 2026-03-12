# Vercel Demo Hosting Design

Date: 2026-03-12

## Summary

Ashfall Collective should ship its first public deployment on Vercel Hobby as a low-cost demo environment. The existing Next.js application remains a single deployable unit, and the app keeps using embedded `PGlite` for now, but all account and progress data are treated as disposable because Vercel does not provide durable app-local storage for this use case.

This deployment is intentionally optimized for speed, cost, and a clean demo URL rather than long-term persistence. If the project later needs reliable player progress, the upgrade path is to move persistence to managed Postgres rather than trying to make local disk durable on Vercel.

## Goals

- Deploy the app publicly with the lowest practical monthly cost, ideally free.
- Use a provider subdomain for the first launch instead of requiring a custom domain.
- Keep the current single-app architecture intact.
- Support a demo experience where occasional resets of user data are acceptable.
- Keep the deployment simple enough to set up directly from the Git repository.

## Non-Goals

- Durable production-grade persistence for player accounts, notes, drafts, or case progress.
- A custom domain for the first launch.
- A managed database or paid infrastructure in the initial deployment.
- Reworking the product for multi-region scale, background jobs, or advanced operations.

## Approaches Considered

### Recommended: Vercel Hobby

Vercel Hobby is the best first host because the app is already a Next.js project and the user prioritized the lowest possible monthly cost. It provides the shortest path to a public demo URL with minimal deployment work.

The main trade-off is that storage must be treated as ephemeral. That matches the approved demo scope.

### Alternative: Render Free Web Service

Render could also host the app as a sleeping Node service, but it adds a little more operational setup and still does not solve the core persistence problem in a clean free-tier way.

### Alternative: Fly.io With Persistent Volume

Fly.io is a stronger fit for keeping embedded storage closer to the app, but it is not the lowest-cost or lowest-friction path for the first demo and is more likely to require paid usage.

## Deployment Architecture

### System Shape

- One Vercel project connected to the Git repository.
- One Next.js deployment serving the public pages, authenticated pages, API routes, and auth callbacks.
- Embedded `PGlite` for demo-state persistence only.
- Case content loaded from the repository and synced into runtime tables as needed.

### Environment Variables

The Vercel deployment should define:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`

`DATABASE_URL` remains present only because the current environment parsing expects it to be a valid URL. It does not represent a managed Postgres requirement for this demo deployment.

### Storage Policy

The runtime should follow this storage policy:

- Local development: keep using `/.data/pglite`
- Tests: use in-memory `PGlite`
- Vercel deployment: prefer an ephemeral temporary directory if available
- Vercel fallback: use in-memory `PGlite` if file-backed startup is not viable

This policy keeps local development convenient while making the hosted demo resilient to Vercel runtime constraints.

## Runtime And Data Behavior

### Demo Expectations

The deployed app should be explicitly treated as a demo environment. Accounts, notes, drafts, and case progress may reset after deploys or runtime recycling, and that should be acceptable by design.

The app should surface a small, clear notice explaining that this is a demo environment and progress may reset occasionally. The goal is to keep the product honest without overwhelming the experience.

### Content Availability

Case content authored in `content/cases/*` remains durable because it ships with the repository. Runtime tables that mirror case definitions can be recreated whenever the app starts from a fresh ephemeral database.

### Failure Handling

The main failure mode to design around is runtime storage setup on Vercel. If file-backed `PGlite` cannot initialize in the deployed environment, the app should degrade to a more temporary mode rather than failing entirely, as long as core demo flows still work.

If auth, routing, or case loading stop working, that is a deployment failure. If user progress resets later, that is an expected limitation of the demo environment.

## Verification

Before deployment, the implementation should pass:

```bash
pnpm build
pnpm vitest
pnpm playwright
```

After deployment, the live Vercel URL should be smoke-tested for:

1. Landing page loads successfully.
2. Signup or sign-in works.
3. Opening a case reaches the investigation workspace.
4. Submitting a report completes without runtime errors.

Cold starts and sleep/wake delays are acceptable for this deployment as long as the app recovers and the demo remains usable.

## Rollout

1. Connect the repository to a Vercel Hobby project.
2. Add the required environment variables in Vercel.
3. Deploy from the main branch.
4. Smoke-test the live URL.
5. Treat data resets as expected demo behavior unless the app becomes unusable for new sessions.

## Upgrade Path

When the app needs durable persistence, the next step should be:

1. Move player-state storage to managed Postgres.
2. Keep case content in the repository until a richer authoring system is needed.
3. Reclassify the deployment from demo-grade to production-grade only after durable persistence and rollout safeguards are in place.

## References

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Functions Docs](https://vercel.com/docs/functions)
- [Render Pricing](https://render.com/pricing)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
