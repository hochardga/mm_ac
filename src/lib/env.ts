import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  if (!input.DATABASE_URL) {
    throw new Error("DATABASE_URL must be a valid database URL");
  }

  if (!input.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is required");
  }

  return envSchema.parse(input);
}
