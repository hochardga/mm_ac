import { describe, expect, test, vi } from "vitest";

import { createPostgresClient } from "@/lib/postgres-client";

describe("createPostgresClient", () => {
  test("creates a pool and exposes a close handle", async () => {
    const end = vi.fn().mockResolvedValue(undefined);
    const Pool = vi.fn(function MockPool() {
      return { end };
    });

    const client = createPostgresClient(
      "postgres://demo:demo@db.example.com:5432/ashfall",
      { Pool },
    );

    expect(Pool).toHaveBeenCalledWith({
      connectionString: "postgres://demo:demo@db.example.com:5432/ashfall",
    });

    await client.close();
    expect(end).toHaveBeenCalledOnce();
  });
});
