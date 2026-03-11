import { describe, expect, test } from "vitest";

import { resolveAuthSecret } from "@/lib/auth-config";

describe("resolveAuthSecret", () => {
  test("falls back to a stable local secret when env is unset", () => {
    expect(resolveAuthSecret({} as NodeJS.ProcessEnv)).toBe("test-secret");
  });

  test("prefers NEXTAUTH_SECRET when provided", () => {
    expect(
      resolveAuthSecret({
        NEXTAUTH_SECRET: "agency-secret",
      } as NodeJS.ProcessEnv),
    ).toBe("agency-secret");
  });
});
