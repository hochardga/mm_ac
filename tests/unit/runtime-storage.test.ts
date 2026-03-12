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

  test("returns false for non-vercel environments", () => {
    expect(isEphemeralDemoDeployment({} as NodeJS.ProcessEnv)).toBe(false);
  });
});
