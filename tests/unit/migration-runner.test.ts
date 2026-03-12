import { describe, expect, test, vi } from "vitest";

import { applyMigrations } from "@/lib/migration-runner";

describe("applyMigrations", () => {
  test("runs unapplied SQL files in journal order", async () => {
    const exec = vi.fn().mockResolvedValue(undefined);
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await applyMigrations(
      { exec, query },
      {
        readFile: async (filePath) => {
          if (String(filePath).endsWith("_journal.json")) {
            return JSON.stringify({
              entries: [{ idx: 0, tag: "0000_short_jetstream" }],
            });
          }

          return "create table demo(id text);";
        },
      },
      "/repo/src/db/migrations",
    );

    expect(exec).toHaveBeenCalledWith(
      expect.stringMatching(/create table if not exists app_migrations/i),
    );
    expect(exec).toHaveBeenCalledWith("create table demo(id text);");
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/insert into app_migrations/i),
      ["0000_short_jetstream"],
    );
  });

  test("skips tags that are already recorded", async () => {
    const exec = vi.fn().mockResolvedValue(undefined);
    const query = vi.fn().mockResolvedValue({
      rows: [{ tag: "0000_short_jetstream" }],
    });

    await applyMigrations(
      { exec, query },
      {
        readFile: async (filePath) => {
          if (String(filePath).endsWith("_journal.json")) {
            return JSON.stringify({
              entries: [{ idx: 0, tag: "0000_short_jetstream" }],
            });
          }

          return "create table demo(id text);";
        },
      },
      "/repo/src/db/migrations",
    );

    expect(exec).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      "select tag from app_migrations where tag = $1",
      ["0000_short_jetstream"],
    );
  });

  test("wraps each unapplied migration in a lock and transaction when supported", async () => {
    const exec = vi.fn().mockResolvedValue(undefined);
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const transaction = vi.fn(async (run) =>
      run({
        exec,
        query,
      }),
    );
    const withLock = vi.fn(async (run) => run());

    await applyMigrations(
      {
        exec,
        query,
        transaction,
        withLock,
      },
      {
        readFile: async (filePath) => {
          if (String(filePath).endsWith("_journal.json")) {
            return JSON.stringify({
              entries: [{ idx: 0, tag: "0000_short_jetstream" }],
            });
          }

          return "create table demo(id text);";
        },
      },
      "/repo/src/db/migrations",
    );

    expect(withLock).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledOnce();
    expect(exec).toHaveBeenCalledWith("create table demo(id text);");
    expect(query).toHaveBeenNthCalledWith(
      1,
      "select tag from app_migrations where tag = $1",
      ["0000_short_jetstream"],
    );
  });
});
