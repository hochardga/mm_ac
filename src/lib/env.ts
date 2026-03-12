import { z } from "zod";

const localEnvSchema = z.object({
  DATABASE_DRIVER: z.literal("pglite"),
  DATABASE_URL: z.string().url().optional(),
});

const hostedEnvSchema = z.object({
  DATABASE_DRIVER: z.literal("postgres"),
  DATABASE_URL: z.string().url(),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  const normalizedInput = {
    ...input,
    DATABASE_DRIVER: input.DATABASE_DRIVER?.trim(),
    DATABASE_URL: input.DATABASE_URL?.trim() || undefined,
  };
  const driver = normalizedInput.DATABASE_DRIVER || "pglite";

  if (driver === "postgres") {
    return hostedEnvSchema.parse({
      ...normalizedInput,
      DATABASE_DRIVER: "postgres",
    });
  }

  return localEnvSchema.parse({
    ...normalizedInput,
    DATABASE_DRIVER: "pglite",
  });
}
