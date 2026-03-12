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
});

describe("isEphemeralDemoDeployment", () => {
  test("still identifies vercel during the transition away from the demo banner", () => {
    expect(isEphemeralDemoDeployment({ VERCEL: "1" })).toBe(true);
    expect(isEphemeralDemoDeployment({} as NodeJS.ProcessEnv)).toBe(false);
  });
});
