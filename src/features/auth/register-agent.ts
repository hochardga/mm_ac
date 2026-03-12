import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { users } from "@/db/schema";
import { hashPassword } from "@/features/auth/password";
import { getDb } from "@/lib/db";

export type RegisterAgentInput = {
  email: string;
  password: string;
  alias: string;
};

export class AgentEmailAlreadyActiveError extends Error {
  constructor() {
    super("Agency email is already active");
    this.name = "AgentEmailAlreadyActiveError";
  }
}

function isDuplicateEmailError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function registerAgent(input: RegisterAgentInput) {
  const db = await getDb();
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existingUser) {
    throw new AgentEmailAlreadyActiveError();
  }

  const passwordHash = await hashPassword(input.password);
  const userId = randomUUID();

  try {
    await db.insert(users).values({
      id: userId,
      email: input.email,
      passwordHash,
      alias: input.alias,
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw new AgentEmailAlreadyActiveError();
    }

    throw error;
  }

  return {
    userId,
    redirectTo: "/vault",
  };
}
