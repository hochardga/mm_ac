import { z } from "zod";

import { parseEnv } from "@/lib/env";
import {
  resolveRuntimeStorage,
  type RuntimeStorage,
} from "@/lib/runtime-storage";

export type DatabaseRuntime =
  | {
      driver: "pglite";
      storage: RuntimeStorage;
    }
  | {
      driver: "postgres";
      connectionString: string;
    };

const postgresUrlSchema = z.string().url();

export function resolveDatabaseRuntime(
  input: NodeJS.ProcessEnv,
  cwd = process.cwd(),
): DatabaseRuntime {
  const env = parseEnv(input);
  const requestedDriver = env.DATABASE_DRIVER;

  if (input.VERCEL === "1" && requestedDriver !== "postgres") {
    throw new Error("Hosted Vercel deployments must set DATABASE_DRIVER=postgres");
  }

  if (requestedDriver === "postgres") {
    return {
      driver: "postgres",
      connectionString: postgresUrlSchema.parse(env.DATABASE_URL),
    };
  }

  return {
    driver: "pglite",
    storage: resolveRuntimeStorage(input, cwd),
  };
}
