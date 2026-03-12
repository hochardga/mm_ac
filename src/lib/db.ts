import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";

import * as schema from "@/db/schema";
import { resolveDatabaseRuntime } from "@/lib/database-runtime";
import { applyMigrations } from "@/lib/migration-runner";
import { createPGliteClient } from "@/lib/pglite-client";
import { createPostgresClient } from "@/lib/postgres-client";

type PgliteDb = ReturnType<typeof drizzlePglite<typeof schema>>;
type PostgresDb = ReturnType<typeof drizzleNodePg<typeof schema>>;
type PgliteTransaction = Parameters<PgliteDb["transaction"]>[0] extends (
  tx: infer T,
  ...args: never[]
) => Promise<unknown>
  ? T
  : never;
type PostgresTransaction = Parameters<PostgresDb["transaction"]>[0] extends (
  tx: infer T,
  ...args: never[]
) => Promise<unknown>
  ? T
  : never;

export type AppDb = PgliteDb | PostgresDb;
export type AppTransaction = PgliteTransaction | PostgresTransaction;

let db: AppDb | undefined;
let initialization: Promise<AppDb> | undefined;
let closeHandle: (() => Promise<unknown>) | undefined;

async function initializeDb() {
  const runtime = resolveDatabaseRuntime(process.env);

  if (runtime.driver === "postgres") {
    const client = createPostgresClient(runtime.connectionString);

    await applyMigrations({
      exec: async (sql) => {
        await client.pool.query(sql);
      },
      query: (sql, params) => client.pool.query(sql, params),
    });

    closeHandle = () => client.close();
    db = drizzleNodePg(client.pool, { schema });
    return db;
  }

  const client = await createPGliteClient(runtime.storage);
  await client.waitReady;

  await applyMigrations({
    exec: (sql) => client.exec(sql),
    query: (sql, params) => client.query(sql, params),
  });

  closeHandle = () => client.close();
  db = drizzlePglite(client, { schema });
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
  await closeHandle?.();
  db = undefined;
  initialization = undefined;
  closeHandle = undefined;
}
