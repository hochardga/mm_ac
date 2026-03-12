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
const MIGRATION_LOCK_ID = 13_279_001;

async function initializeDb() {
  const runtime = resolveDatabaseRuntime(process.env);

  if (runtime.driver === "postgres") {
    const client = createPostgresClient(runtime.connectionString);
    try {
      const migrationConnection = await client.pool.connect();

      try {
        const migrationExec = async (sql: string) => {
          await migrationConnection.query(sql);
        };
        const migrationQuery = (sql: string, params?: unknown[]) =>
          migrationConnection.query(sql, params);

        await applyMigrations({
          exec: migrationExec,
          query: migrationQuery,
          transaction: async (run) => {
            await migrationQuery("begin");

            try {
              const result = await run({
                exec: migrationExec,
                query: migrationQuery,
              });

              await migrationQuery("commit");
              return result;
            } catch (error) {
              await migrationQuery("rollback");
              throw error;
            }
          },
          withLock: async (run) => {
            await migrationQuery("select pg_advisory_lock($1)", [
              MIGRATION_LOCK_ID,
            ]);

            try {
              return await run();
            } finally {
              await migrationQuery("select pg_advisory_unlock($1)", [
                MIGRATION_LOCK_ID,
              ]);
            }
          },
        });
      } finally {
        migrationConnection.release();
      }

      closeHandle = () => client.close();
      db = drizzleNodePg(client.pool, { schema });
      return db;
    } catch (error) {
      await client.close();
      throw error;
    }
  }

  const client = await createPGliteClient(runtime.storage);
  try {
    await client.waitReady;

    await applyMigrations({
      exec: (sql) => client.exec(sql),
      query: (sql, params) => client.query(sql, params),
    });

    closeHandle = () => client.close();
    db = drizzlePglite(client, { schema });
    return db;
  } catch (error) {
    await client.close();
    throw error;
  }
}

export async function getDb() {
  if (db) {
    return db;
  }

  if (!initialization) {
    initialization = initializeDb();
  }

  try {
    db = await initialization;
    return db;
  } catch (error) {
    db = undefined;
    initialization = undefined;
    closeHandle = undefined;
    throw error;
  }
}

export async function closeDb() {
  await closeHandle?.();
  db = undefined;
  initialization = undefined;
  closeHandle = undefined;
}
