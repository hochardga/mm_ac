import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";
import { parseEnv } from "@/lib/env";

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!db) {
    const env = parseEnv(process.env);

    pool = new Pool({
      connectionString: env.DATABASE_URL,
    });

    db = drizzle(pool, { schema });
  }

  return db;
}

export async function closeDb() {
  await pool?.end();
  db = undefined;
  pool = undefined;
}
