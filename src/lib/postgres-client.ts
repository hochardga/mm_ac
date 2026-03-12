import { Pool } from "pg";

type PoolCtor = typeof Pool;

export function createPostgresClient(
  connectionString: string,
  deps: { Pool: PoolCtor } = { Pool },
) {
  const pool = new deps.Pool({ connectionString });

  return {
    pool,
    close: () => pool.end(),
  };
}
