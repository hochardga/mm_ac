import { describe, expect, test } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  test("requires the auth secret and database url", () => {
    expect(() => parseEnv({} as NodeJS.ProcessEnv)).toThrow(/database url/i);
  });
});
