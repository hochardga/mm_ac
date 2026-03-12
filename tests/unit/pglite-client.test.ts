import { describe, expect, test, vi } from "vitest";

import { createPGliteClient } from "@/lib/pglite-client";

describe("createPGliteClient", () => {
  test("uses the file-backed client when filesystem init succeeds", async () => {
    const mkdir = vi.fn().mockResolvedValue(undefined);
    const fileClient = { kind: "file-client" };
    const openFileClient = vi.fn().mockResolvedValue(fileClient);
    const openMemoryClient = vi.fn();
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

    expect(mkdir).toHaveBeenCalledWith("/tmp/ashfall-collective-pglite", {
      recursive: true,
    });
    expect(openFileClient).toHaveBeenCalledOnce();
    expect(openMemoryClient).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(client).toEqual(fileClient);
  });

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

  test("rethrows errors when non-ephemeral storage initialization fails", async () => {
    const mkdir = vi.fn().mockRejectedValue(new Error("EACCES"));
    const openFileClient = vi.fn();
    const openMemoryClient = vi.fn();
    const warn = vi.fn();

    await expect(
      createPGliteClient(
        {
          kind: "filesystem",
          dataDir: "/var/lib/ashfall-collective-pglite",
          isEphemeral: false,
        },
        {
          mkdir,
          openFileClient,
          openMemoryClient,
          warn,
        },
      ),
    ).rejects.toThrow("EACCES");

    expect(openFileClient).not.toHaveBeenCalled();
    expect(openMemoryClient).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  test("uses the in-memory client when storage kind is memory", async () => {
    const mkdir = vi.fn();
    const openFileClient = vi.fn();
    const memoryClient = { kind: "memory-client" };
    const openMemoryClient = vi.fn().mockResolvedValue(memoryClient);
    const warn = vi.fn();

    const client = await createPGliteClient(
      {
        kind: "memory",
        isEphemeral: true,
      },
      {
        mkdir,
        openFileClient,
        openMemoryClient,
        warn,
      },
    );

    expect(openMemoryClient).toHaveBeenCalledOnce();
    expect(openFileClient).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(client).toEqual(memoryClient);
  });
});
