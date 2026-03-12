import { describe, expect, test } from "vitest";

import nextConfig from "../../next.config";

describe("next.config", () => {
  test("keeps dev-only config values stable", () => {
    expect(nextConfig.allowedDevOrigins).toEqual(["127.0.0.1"]);
    expect(nextConfig.serverExternalPackages).toEqual([
      "@electric-sql/pglite",
    ]);
  });

  test("traces runtime asset folders for all routes", () => {
    const tracingIncludes = nextConfig.outputFileTracingIncludes?.["/*"];

    expect(tracingIncludes).toEqual(
      expect.arrayContaining([
        "src/db/migrations/**/*",
        "content/cases/**/*",
      ]),
    );
  });
});
