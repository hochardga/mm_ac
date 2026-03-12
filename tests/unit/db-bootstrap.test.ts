import { afterEach, expect, test, vi } from "vitest";

const resolveDatabaseRuntime = vi.fn();
const createPGliteClient = vi.fn();
const createPostgresClient = vi.fn();
const applyMigrations = vi.fn();

vi.mock("@/lib/database-runtime", () => ({
  resolveDatabaseRuntime,
}));

vi.mock("@/lib/pglite-client", () => ({
  createPGliteClient,
}));

vi.mock("@/lib/postgres-client", () => ({
  createPostgresClient,
}));

vi.mock("@/lib/migration-runner", () => ({
  applyMigrations,
}));

afterEach(() => {
  vi.resetModules();
});

test("bootstraps postgres when the runtime selects postgres", async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const close = vi.fn().mockResolvedValue(undefined);

  resolveDatabaseRuntime.mockReturnValue({
    driver: "postgres",
    connectionString: "postgres://demo:demo@db.example.com:5432/ashfall",
  });
  createPostgresClient.mockReturnValue({
    pool: { query },
    close,
  });

  const { closeDb, getDb } = await import("@/lib/db");

  await getDb();

  expect(createPostgresClient).toHaveBeenCalledOnce();
  expect(createPGliteClient).not.toHaveBeenCalled();
  expect(applyMigrations).toHaveBeenCalledOnce();

  await closeDb();
  expect(close).toHaveBeenCalledOnce();
});
