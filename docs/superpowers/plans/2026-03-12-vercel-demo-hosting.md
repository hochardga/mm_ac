# Vercel Demo Hosting Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Ashfall Collective deployable on Vercel Hobby as a low-cost demo by hardening `PGlite` for ephemeral hosting, surfacing reset expectations in the UI, and documenting the deployment flow.

**Architecture:** Add a small runtime-storage policy layer that decides whether the app should use local disk, an ephemeral Vercel temp directory, or in-memory fallback. Keep the existing Next.js and NextAuth structure intact, make the demo limitation explicit in the app shell, and capture the Vercel setup steps in repo docs instead of introducing new infrastructure.

**Tech Stack:** Next.js 16, React 19, TypeScript, NextAuth, `@electric-sql/pglite`, Vitest, Testing Library, Playwright, pnpm, Vercel Hobby

---

## Scope Check

The approved spec covers one subsystem: demo deployment readiness for the existing app. This plan intentionally does not include durable Postgres persistence, custom domains, CI/CD changes outside Vercel, or broader production-hardening work.

## File Structure

- `docs/superpowers/specs/2026-03-12-vercel-demo-hosting-design.md`: approved design reference for the hosting work
- `src/lib/runtime-storage.ts`: pure runtime-policy helper that resolves local, test, and Vercel storage behavior
- `src/lib/pglite-client.ts`: focused `PGlite` bootstrap helper that handles ephemeral filesystem fallback
- `src/lib/db.ts`: database initialization entrypoint that consumes the new helpers
- `src/components/demo-environment-banner.tsx`: small reusable notice for resettable-demo messaging
- `src/app/layout.tsx`: global app shell location for the demo banner
- `.env.example`: deployment-facing environment variable guidance
- `README.md`: operator setup and Vercel Hobby deployment instructions
- `tests/unit/runtime-storage.test.ts`: unit coverage for runtime-policy decisions
- `tests/unit/pglite-client.test.ts`: unit coverage for `PGlite` fallback behavior
- `tests/unit/root-layout.test.tsx`: app-shell coverage for the Vercel demo notice
- `tests/unit/db.test.ts`: smoke coverage proving the database still initializes correctly in tests

## Implementation Notes

- Follow strict TDD for the code changes: write the failing test first, verify the failure, implement the minimal code, then rerun the tests.
- Keep the runtime-policy helper pure. It should decide storage behavior from environment variables without touching the filesystem.
- Keep the `PGlite` bootstrap helper narrow. It should own fallback behavior, but not migrations or Drizzle wiring.
- Do not add managed Postgres, Vercel KV, or other paid storage products in this plan.
- The README and `.env.example` task is documentation-heavy rather than TDD-heavy; compensate by running the full verification suite before the final commit.

## Chunk 1: Runtime Storage Hardening

### Task 1: Encode the runtime storage policy

**Files:**
- Create: `src/lib/runtime-storage.ts`
- Create: `tests/unit/runtime-storage.test.ts`

- [ ] **Step 1: Write the failing runtime-policy tests**

```ts
import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  isEphemeralDemoDeployment,
  resolveRuntimeStorage,
} from "@/lib/runtime-storage";

describe("resolveRuntimeStorage", () => {
  test("uses in-memory storage during tests", () => {
    expect(resolveRuntimeStorage({ NODE_ENV: "test" }, "/repo")).toEqual({
      kind: "memory",
      isEphemeral: true,
    });
  });

  test("uses the local .data directory outside vercel", () => {
    expect(resolveRuntimeStorage({}, "/repo")).toEqual({
      kind: "filesystem",
      dataDir: path.join("/repo", ".data", "pglite"),
      isEphemeral: false,
    });
  });

  test("uses an ephemeral /tmp directory on vercel", () => {
    expect(resolveRuntimeStorage({ VERCEL: "1" }, "/repo")).toEqual({
      kind: "filesystem",
      dataDir: path.join("/tmp", "ashfall-collective-pglite"),
      isEphemeral: true,
    });
  });
});

describe("isEphemeralDemoDeployment", () => {
  test("returns true for vercel-hosted demo deployments", () => {
    expect(isEphemeralDemoDeployment({ VERCEL: "1" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/unit/runtime-storage.test.ts`

Expected: FAIL because `src/lib/runtime-storage.ts` does not exist yet

- [ ] **Step 3: Implement the minimal runtime-policy helper**

```ts
import path from "node:path";

export type RuntimeStorage =
  | {
      kind: "memory";
      isEphemeral: true;
    }
  | {
      kind: "filesystem";
      dataDir: string;
      isEphemeral: boolean;
    };

export function isEphemeralDemoDeployment(input: NodeJS.ProcessEnv) {
  return input.VERCEL === "1";
}

export function resolveRuntimeStorage(
  input: NodeJS.ProcessEnv,
  cwd = process.cwd(),
): RuntimeStorage {
  if (input.NODE_ENV === "test") {
    return {
      kind: "memory",
      isEphemeral: true,
    };
  }

  if (isEphemeralDemoDeployment(input)) {
    return {
      kind: "filesystem",
      dataDir: path.join("/tmp", "ashfall-collective-pglite"),
      isEphemeral: true,
    };
  }

  return {
    kind: "filesystem",
    dataDir: path.join(cwd, ".data", "pglite"),
    isEphemeral: false,
  };
}
```

- [ ] **Step 4: Re-run the runtime-policy test**

Run: `pnpm vitest tests/unit/runtime-storage.test.ts`

Expected: PASS

- [ ] **Step 5: Commit the runtime-policy helper**

```bash
git add src/lib/runtime-storage.ts tests/unit/runtime-storage.test.ts
git commit -m "feat: add runtime storage policy for demo hosting"
```

### Task 2: Add `PGlite` fallback behavior for ephemeral hosts

**Files:**
- Create: `src/lib/pglite-client.ts`
- Modify: `src/lib/db.ts`
- Create: `tests/unit/pglite-client.test.ts`
- Modify: `tests/unit/db.test.ts`

- [ ] **Step 1: Write the failing fallback test**

```ts
import { describe, expect, test, vi } from "vitest";

import { createPGliteClient } from "@/lib/pglite-client";

describe("createPGliteClient", () => {
  test("falls back to memory when ephemeral filesystem setup fails", async () => {
    const mkdir = vi.fn().mockRejectedValue(new Error("EACCES"));
    const openFileClient = vi.fn();
    const openMemoryClient = vi.fn().mockResolvedValue({ kind: "memory-client" });
    const warn = vi.fn();

    const client = await createPGliteClient(
      {
        kind: "filesystem",
        dataDir: "/tmp/ashfall-collective-pglite",
        isEphemeral: true,
      },
      {
        mkdir,
        openFileClient,
        openMemoryClient,
        warn,
      },
    );

    expect(openFileClient).not.toHaveBeenCalled();
    expect(openMemoryClient).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledOnce();
    expect(client).toEqual({ kind: "memory-client" });
  });
});
```

- [ ] **Step 2: Run the fallback test to verify it fails**

Run: `pnpm vitest tests/unit/pglite-client.test.ts`

Expected: FAIL because `src/lib/pglite-client.ts` does not exist yet

- [ ] **Step 3: Implement the `PGlite` bootstrap helper and wire it into `db.ts`**

```ts
import { mkdir } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";

import type { RuntimeStorage } from "@/lib/runtime-storage";

type BootstrapDeps = {
  mkdir: typeof mkdir;
  openFileClient: (dataDir: string) => Promise<PGlite> | PGlite;
  openMemoryClient: () => Promise<PGlite> | PGlite;
  warn: (message: string, error: unknown) => void;
};

const defaultDeps: BootstrapDeps = {
  mkdir,
  openFileClient: (dataDir) => new PGlite(dataDir),
  openMemoryClient: () => new PGlite(),
  warn: (message, error) => console.warn(message, error),
};

export async function createPGliteClient(
  storage: RuntimeStorage,
  deps: BootstrapDeps = defaultDeps,
) {
  if (storage.kind === "memory") {
    return deps.openMemoryClient();
  }

  try {
    await deps.mkdir(storage.dataDir, { recursive: true });
    return await deps.openFileClient(storage.dataDir);
  } catch (error) {
    if (!storage.isEphemeral) {
      throw error;
    }

    deps.warn("Falling back to in-memory PGlite for demo hosting.", error);
    return deps.openMemoryClient();
  }
}
```

```ts
import { createPGliteClient } from "@/lib/pglite-client";
import { resolveRuntimeStorage } from "@/lib/runtime-storage";

async function initializeDb() {
  const storage = resolveRuntimeStorage(process.env);

  client = await createPGliteClient(storage);
  await client.waitReady;

  await applyMigrations(client);
  db = drizzle(client, { schema });

  return db;
}
```

- [ ] **Step 4: Extend the database smoke test and rerun targeted coverage**

Add this assertion to `tests/unit/db.test.ts` after the existing insert/select flow:

```ts
expect(records[0]?.email).toBe("agent@example.com");
```

Run: `pnpm vitest tests/unit/pglite-client.test.ts tests/unit/db.test.ts`

Expected: PASS

- [ ] **Step 5: Commit the runtime fallback changes**

```bash
git add src/lib/pglite-client.ts src/lib/db.ts tests/unit/pglite-client.test.ts tests/unit/db.test.ts
git commit -m "feat: support ephemeral pglite hosting"
```

## Chunk 2: Demo Messaging and Deployment Docs

### Task 3: Surface the resettable-demo notice in the app shell

**Files:**
- Create: `src/components/demo-environment-banner.tsx`
- Modify: `src/app/layout.tsx`
- Create: `tests/unit/root-layout.test.tsx`

- [ ] **Step 1: Write the failing app-shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

import RootLayout from "@/app/layout";

afterEach(() => {
  delete process.env.VERCEL;
});

test("shows the demo reset notice on vercel deployments", () => {
  process.env.VERCEL = "1";

  render(
    <RootLayout>
      <div>Child content</div>
    </RootLayout>,
  );

  expect(
    screen.getByText(/demo environment: progress may reset occasionally/i),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the app-shell test to verify it fails**

Run: `pnpm vitest tests/unit/root-layout.test.tsx`

Expected: FAIL because the banner component and layout wiring do not exist yet

- [ ] **Step 3: Implement the banner and render it from the root layout**

```tsx
import { isEphemeralDemoDeployment } from "@/lib/runtime-storage";

export function DemoEnvironmentBanner() {
  if (!isEphemeralDemoDeployment(process.env)) {
    return null;
  }

  return (
    <div className="border-b border-amber-300/30 bg-amber-100 px-4 py-3 text-center text-sm text-stone-900">
      Demo environment: progress may reset occasionally.
    </div>
  );
}
```

```tsx
import { DemoEnvironmentBanner } from "@/components/demo-environment-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DemoEnvironmentBanner />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Re-run the app-shell coverage**

Run: `pnpm vitest tests/unit/root-layout.test.tsx tests/unit/app-shell.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the demo notice**

```bash
git add src/components/demo-environment-banner.tsx src/app/layout.tsx tests/unit/root-layout.test.tsx
git commit -m "feat: add demo hosting notice"
```

### Task 4: Document and verify the Vercel Hobby deployment flow

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Update `.env.example` with hosted-demo guidance**

Use comments that make the split explicit:

```dotenv
# Vercel Hobby demo deploys still use embedded PGlite.
# Keep DATABASE_URL as a valid URL because env parsing expects it.
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ashfall_collective
NEXTAUTH_SECRET=replace-me
# Local: http://127.0.0.1:3000
# Hosted demo: https://<your-project>.vercel.app
NEXTAUTH_URL=http://127.0.0.1:3000
```

- [ ] **Step 2: Add a Vercel deployment section to `README.md`**

Include these points explicitly:

```md
## Vercel Demo Deployment

This app can be deployed on Vercel Hobby as a demo-grade environment.

Required environment variables:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=https://<your-project>.vercel.app`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/ashfall_collective`

Notes:

- Player data is temporary and may reset after deploys or runtime recycling.
- Case content still comes from `content/cases/*`.
- If file-backed `PGlite` cannot initialize on Vercel, the app should fall back to in-memory demo storage.
```

- [ ] **Step 3: Run the production build and targeted tests**

Run: `pnpm build`

Expected: PASS and emit a production Next.js build without runtime-storage errors

Run: `pnpm vitest tests/unit/runtime-storage.test.ts tests/unit/pglite-client.test.ts tests/unit/root-layout.test.tsx tests/unit/db.test.ts`

Expected: PASS

- [ ] **Step 4: Run the full automated verification suite**

Run: `pnpm vitest`

Expected: PASS

Run: `pnpm playwright`

Expected: PASS

- [ ] **Step 5: Commit the deployment docs**

```bash
git add .env.example README.md
git commit -m "docs: add vercel demo deployment guide"
```

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-03-12-vercel-demo-hosting.md`. Ready to execute with `superpowers:subagent-driven-development`.
