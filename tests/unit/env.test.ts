import { describe, expect, test } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  test("allows local pglite without a postgres url", () => {
    expect(parseEnv({} as NodeJS.ProcessEnv)).toMatchObject({
      DATABASE_DRIVER: "pglite",
    });
  });

  test("requires DATABASE_URL when postgres is selected", () => {
    expect(() =>
      parseEnv({
        DATABASE_DRIVER: "postgres",
      } as NodeJS.ProcessEnv),
    ).toThrow(/DATABASE_URL/i);
  });

  test("trims hosted postgres environment values before validation", () => {
    expect(
      parseEnv({
        DATABASE_DRIVER: " postgres ",
        DATABASE_URL: " https://db.example.com/app ",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      DATABASE_DRIVER: "postgres",
      DATABASE_URL: "https://db.example.com/app",
    });
  });
});
