import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

type MigrationExecutor = {
  exec: (sql: string) => Promise<unknown>;
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

type MigrationClient = MigrationExecutor & {
  transaction?: <T>(run: (tx: MigrationExecutor) => Promise<T>) => Promise<T>;
  withLock?: <T>(run: () => Promise<T>) => Promise<T>;
};

type MigrationDeps = {
  readFile: typeof readFile;
};

const defaultDeps: MigrationDeps = {
  readFile,
};

type MigrationJournal = {
  entries: Array<{
    idx: number;
    tag: string;
  }>;
};

const migrationJournalSchema = z.object({
  entries: z.array(
    z.object({
      idx: z.number().int(),
      tag: z.string().min(1),
    }),
  ),
});

function parseMigrationJournal(journalRaw: string, journalPath: string) {
  try {
    const parsed = JSON.parse(journalRaw) as unknown;
    const result = migrationJournalSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ");

      throw new Error(`Invalid migration journal at ${journalPath}: ${issues}`);
    }

    return result.data as MigrationJournal;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Invalid migration journal")
    ) {
      throw error;
    }

    throw new Error(
      `Invalid migration journal at ${journalPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function applyMigrationEntry(
  client: MigrationExecutor,
  entry: MigrationJournal["entries"][number],
  deps: MigrationDeps,
  migrationsRoot: string,
) {
  const existing = await client.query(
    "select tag from app_migrations where tag = $1",
    [entry.tag],
  );

  if (existing.rows.length > 0) {
    return;
  }

  const sql = await deps.readFile(
    path.join(migrationsRoot, `${entry.tag}.sql`),
    "utf8",
  );
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.exec(statement);
  }

  await client.query(
    "insert into app_migrations (tag) values ($1) on conflict (tag) do nothing",
    [entry.tag],
  );
}

export async function applyMigrations(
  client: MigrationClient,
  deps: MigrationDeps = defaultDeps,
  migrationsRoot = path.join(process.cwd(), "src", "db", "migrations"),
) {
  await client.exec(`
    create table if not exists app_migrations (
      tag text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const journalPath = path.join(migrationsRoot, "meta", "_journal.json");
  const journalRaw = await deps.readFile(journalPath, "utf8");
  const journal = parseMigrationJournal(journalRaw, journalPath);
  const applyEntries = async () => {
    for (const entry of journal.entries.sort((left, right) => left.idx - right.idx)) {
      if (client.transaction) {
        await client.transaction((tx) =>
          applyMigrationEntry(tx, entry, deps, migrationsRoot),
        );
        continue;
      }

      await applyMigrationEntry(client, entry, deps, migrationsRoot);
    }
  };

  if (client.withLock) {
    await client.withLock(applyEntries);
    return;
  }

  await applyEntries();
}
