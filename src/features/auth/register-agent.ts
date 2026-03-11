import "server-only";

import { randomUUID } from "node:crypto";

import { users } from "@/db/schema";
import { hashPassword } from "@/features/auth/password";
import { getDb } from "@/lib/db";

export type RegisterAgentInput = {
  email: string;
  password: string;
  alias: string;
};

export async function registerAgent(input: RegisterAgentInput) {
  const db = await getDb();
  const passwordHash = await hashPassword(input.password);
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: input.email,
    passwordHash,
    alias: input.alias,
  });

  return {
    userId,
    redirectTo: "/vault",
  };
}
