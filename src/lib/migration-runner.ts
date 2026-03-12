import { readFile } from "node:fs/promises";
import path from "node:path";

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

  const journalRaw = await deps.readFile(
    path.join(migrationsRoot, "meta", "_journal.json"),
    "utf8",
  );
  const journal = JSON.parse(journalRaw) as MigrationJournal;
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
