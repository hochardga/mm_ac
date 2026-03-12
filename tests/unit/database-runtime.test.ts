import path from "node:path";
import { describe, expect, test } from "vitest";

import { resolveDatabaseRuntime } from "@/lib/database-runtime";

describe("resolveDatabaseRuntime", () => {
  test("uses in-memory pglite during tests", () => {
    expect(resolveDatabaseRuntime({ NODE_ENV: "test" }, "/repo")).toEqual({
      driver: "pglite",
      storage: { kind: "memory", isEphemeral: true },
    });
  });

  test("uses filesystem pglite locally by default", () => {
    expect(resolveDatabaseRuntime({}, "/repo")).toEqual({
      driver: "pglite",
      storage: {
        kind: "filesystem",
        dataDir: path.join("/repo", ".data", "pglite"),
        isEphemeral: false,
      },
    });
  });

  test("requires hosted vercel deployments to use postgres", () => {
    expect(() => resolveDatabaseRuntime({ VERCEL: "1" }, "/repo")).toThrow(
      /DATABASE_DRIVER=postgres/i,
    );
  });

  test("returns postgres runtime when explicitly configured", () => {
    expect(
      resolveDatabaseRuntime(
        {
          VERCEL: "1",
          DATABASE_DRIVER: "postgres",
          DATABASE_URL: "postgres://demo:demo@db.example.com:5432/ashfall",
        },
        "/repo",
      ),
    ).toEqual({
      driver: "postgres",
      connectionString: "postgres://demo:demo@db.example.com:5432/ashfall",
    });
  });

  test("rejects non-postgres connection string schemes for postgres runtime", () => {
    expect(() =>
      resolveDatabaseRuntime(
        {
          VERCEL: "1",
          DATABASE_DRIVER: "postgres",
          DATABASE_URL: "https://db.example.com/ashfall",
        },
        "/repo",
      ),
    ).toThrow(/postgres/i);
  });
});
