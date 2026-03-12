import { z } from "zod";

const localEnvSchema = z.object({
  DATABASE_DRIVER: z.literal("pglite").default("pglite"),
  DATABASE_URL: z.string().url().optional(),
});

const hostedEnvSchema = z.object({
  DATABASE_DRIVER: z.literal("postgres"),
  DATABASE_URL: z.string().url(),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  const driver = input.DATABASE_DRIVER?.trim() || "pglite";

  if (driver === "postgres") {
    return hostedEnvSchema.parse(input);
  }

  return localEnvSchema.parse({
    ...input,
    DATABASE_DRIVER: "pglite",
  });
}
