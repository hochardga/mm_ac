import { mkdir } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";

import type { RuntimeStorage } from "@/lib/runtime-storage";

type BootstrapDeps = {
  mkdir: typeof mkdir;
  openFileClient: (dataDir: string) => Promise<PGlite> | PGlite;
  openMemoryClient: () => Promise<PGlite> | PGlite;
  warn: (message: string, error: unknown) => void;
};

const defaultDeps: BootstrapDeps = {
  mkdir,
  openFileClient: (dataDir) => new PGlite(dataDir),
  openMemoryClient: () => new PGlite(),
  warn: (message, error) => console.warn(message, error),
};

export async function createPGliteClient(
  storage: RuntimeStorage,
  deps: BootstrapDeps = defaultDeps,
) {
  if (storage.kind === "memory") {
    return deps.openMemoryClient();
  }

  try {
    await deps.mkdir(storage.dataDir, { recursive: true });
    return await deps.openFileClient(storage.dataDir);
  } catch (error) {
    if (!storage.isEphemeral) {
      throw error;
    }

    deps.warn("Falling back to in-memory PGlite for demo hosting.", error);
    return deps.openMemoryClient();
  }
}
