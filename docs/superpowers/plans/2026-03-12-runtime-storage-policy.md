# Runtime Storage Policy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encode the deterministic runtime storage policy for the demo deployment so other modules can query storage behavior without duplicating logic.

**Architecture:** A tiny module exports `resolveRuntimeStorage` and `isEphemeralDemoDeployment`, keeping environment-detection logic centralized. Tests ensure environments (`NODE_ENV`, `VERCEL`) map to the expected storage kinds before other code depends on it.

**Tech Stack:** Node + TypeScript, `path` for directory resolution, Vitest for unit tests.

---

### Task 1: Runtime storage policy helper

**Files:**
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/codex/vercel-demo-hosting/src/lib/runtime-storage.ts`
- Create: `/Users/gregoryhochard/Development/mm_ac/.worktrees/codex/vercel-demo-hosting/tests/unit/runtime-storage.test.ts`

- [ ] **Step 1: Write the failing test**

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
Expected: FAIL because `src/lib/runtime-storage.ts` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest tests/unit/runtime-storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the changes**

```bash
git add src/lib/runtime-storage.ts tests/unit/runtime-storage.test.ts
git commit -m "feat: add runtime storage policy for demo hosting"
```
