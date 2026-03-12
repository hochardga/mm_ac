import { readFile } from "node:fs/promises";
import path from "node:path";

type MigrationClient = {
  exec: (sql: string) => Promise<void>;
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
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

  for (const entry of journal.entries.sort((left, right) => left.idx - right.idx)) {
    const existing = await client.query(
      "select tag from app_migrations where tag = $1",
      [entry.tag],
    );

    if (existing.rows.length > 0) {
      continue;
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
}
