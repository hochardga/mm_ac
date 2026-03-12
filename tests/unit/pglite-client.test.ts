import { describe, expect, test, vi } from "vitest";

import { createPGliteClient } from "@/lib/pglite-client";

describe("createPGliteClient", () => {
  test("falls back to memory when ephemeral filesystem setup fails", async () => {
    const mkdir = vi.fn().mockRejectedValue(new Error("EACCES"));
    const openFileClient = vi.fn();
    const openMemoryClient = vi.fn().mockResolvedValue({ kind: "memory-client" });
    const warn = vi.fn();

    const client = await createPGliteClient(
      {
        kind: "filesystem",
        dataDir: "/tmp/ashfall-collective-pglite",
        isEphemeral: true,
      },
      {
        mkdir,
        openFileClient,
        openMemoryClient,
        warn,
      },
    );

    expect(openFileClient).not.toHaveBeenCalled();
    expect(openMemoryClient).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledOnce();
    expect(client).toEqual({ kind: "memory-client" });
  });
});
