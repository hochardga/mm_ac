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

  test("still falls back outside of Vercel when no secret is provided", () => {
    expect(
      resolveAuthSecret({ VERCEL: "0" } as NodeJS.ProcessEnv),
    ).toBe("test-secret");
  });

  test("throws when NEXTAUTH_SECRET missing on Vercel", () => {
    expect(() =>
      resolveAuthSecret({ VERCEL: "1" } as NodeJS.ProcessEnv),
    ).toThrow("NEXTAUTH_SECRET");
  });

  test("treats an empty NEXTAUTH_SECRET as missing on Vercel", () => {
    expect(() =>
      resolveAuthSecret({
        VERCEL: "1",
        NEXTAUTH_SECRET: "",
      } as NodeJS.ProcessEnv),
    ).toThrow("NEXTAUTH_SECRET");
  });

  test("rejects the example placeholder secret on Vercel", () => {
    expect(() =>
      resolveAuthSecret({
        VERCEL: "1",
        NEXTAUTH_SECRET: "replace-me",
      } as NodeJS.ProcessEnv),
    ).toThrow("NEXTAUTH_SECRET");
  });
});
