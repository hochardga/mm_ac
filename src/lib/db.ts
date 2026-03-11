import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

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

  client = dataDir ? new PGlite(dataDir) : new PGlite();
  await client.waitReady;

  db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });

  return db;
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
