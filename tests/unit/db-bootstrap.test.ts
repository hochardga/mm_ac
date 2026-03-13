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
  vi.clearAllMocks();
  vi.resetModules();
});

test("bootstraps postgres when the runtime selects postgres", async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const close = vi.fn().mockResolvedValue(undefined);
  const release = vi.fn();

  resolveDatabaseRuntime.mockReturnValue({
    driver: "postgres",
    connectionString: "postgres://demo:demo@db.example.com:5432/ashfall",
  });
  createPostgresClient.mockReturnValue({
    pool: {
      connect: vi.fn().mockResolvedValue({
        query,
        release,
      }),
      query,
    },
    close,
  });

  const { closeDb, getDb } = await import("@/lib/db");

  await getDb();

  expect(createPostgresClient).toHaveBeenCalledOnce();
  expect(createPGliteClient).not.toHaveBeenCalled();
  expect(applyMigrations).toHaveBeenCalledOnce();

  await closeDb();
  expect(close).toHaveBeenCalledOnce();
  expect(release).toHaveBeenCalledOnce();
});

test("retries postgres initialization after a failed first attempt", async () => {
  const firstQuery = vi.fn().mockResolvedValue({ rows: [] });
  const secondQuery = vi.fn().mockResolvedValue({ rows: [] });
  const firstClose = vi.fn().mockResolvedValue(undefined);
  const secondClose = vi.fn().mockResolvedValue(undefined);
  const firstRelease = vi.fn();
  const secondRelease = vi.fn();

  resolveDatabaseRuntime.mockReturnValue({
    driver: "postgres",
    connectionString: "postgres://demo:demo@db.example.com:5432/ashfall",
  });
  createPostgresClient
    .mockReturnValueOnce({
      pool: {
        connect: vi.fn().mockResolvedValue({
          query: firstQuery,
          release: firstRelease,
        }),
        query: firstQuery,
      },
      close: firstClose,
    })
    .mockReturnValueOnce({
      pool: {
        connect: vi.fn().mockResolvedValue({
          query: secondQuery,
          release: secondRelease,
        }),
        query: secondQuery,
      },
      close: secondClose,
    });
  applyMigrations
    .mockRejectedValueOnce(new Error("temporary bootstrap failure"))
    .mockResolvedValueOnce(undefined);

  const { closeDb, getDb } = await import("@/lib/db");

  await expect(getDb()).rejects.toThrow("temporary bootstrap failure");
  await expect(getDb()).resolves.toBeDefined();

  expect(createPostgresClient).toHaveBeenCalledTimes(2);
  expect(firstClose).toHaveBeenCalledOnce();
  expect(secondClose).not.toHaveBeenCalled();

  await closeDb();

  expect(secondClose).toHaveBeenCalledOnce();
  expect(firstRelease).toHaveBeenCalledOnce();
  expect(secondRelease).toHaveBeenCalledOnce();
});
