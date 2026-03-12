import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import * as schema from "@/db/schema";

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let client: PGlite | undefined;
let db: AppDb | undefined;
let initialization: Promise<AppDb> | undefined;

function resolveDataDir() {
  if (process.env.NODE_ENV === "test") {
    return undefined;
  }

  return path.join(process.cwd(), ".data", "pglite");
}

async function initializeDb() {
  const dataDir = resolveDataDir();

  if (dataDir) {
    await mkdir(dataDir, { recursive: true });
  }

  client = dataDir ? new PGlite(dataDir) : new PGlite();
  await client.waitReady;

  await applyMigrations(client);

  db = drizzle(client, { schema });

  return db;
}

type MigrationJournal = {
  entries: Array<{
    idx: number;
    tag: string;
  }>;
};

async function applyMigrations(dbClient: PGlite) {
  await dbClient.exec(`
    create table if not exists app_migrations (
      tag text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const migrationsRoot = path.join(process.cwd(), "src", "db", "migrations");
  const journalRaw = await readFile(
    path.join(migrationsRoot, "meta", "_journal.json"),
    "utf8",
  );
  const journal = JSON.parse(journalRaw) as MigrationJournal;

  for (const entry of journal.entries.sort((left, right) => left.idx - right.idx)) {
    const existing = await dbClient.query(
      "select tag from app_migrations where tag = $1",
      [entry.tag],
    );

    if (existing.rows.length > 0) {
      continue;
    }

    const sql = await readFile(path.join(migrationsRoot, `${entry.tag}.sql`), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await dbClient.exec(statement);
    }

    await dbClient.query("insert into app_migrations (tag) values ($1)", [entry.tag]);
  }
}

export async function getDb() {
  if (db) {
    return db;
  }

  if (!initialization) {
    initialization = initializeDb();
  }

  db = await initialization;
  return db;
}

export async function closeDb() {
  await client?.close();
  db = undefined;
  client = undefined;
  initialization = undefined;
}
