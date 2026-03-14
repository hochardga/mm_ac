import "server-only";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function resolveStoredAgentId(input: {
  sessionUserId?: string;
  intakeUserId?: string;
}) {
  const db = await getDb();

  if (input.sessionUserId) {
    const sessionUser = await db.query.users.findFirst({
      where: eq(users.id, input.sessionUserId),
    });

    if (sessionUser) {
      return sessionUser.id;
    }
  }

  if (input.intakeUserId && input.intakeUserId !== input.sessionUserId) {
    const intakeUser = await db.query.users.findFirst({
      where: eq(users.id, input.intakeUserId),
    });

    if (intakeUser) {
      return intakeUser.id;
    }
  }

  return undefined;
}

export async function getCurrentAgentId() {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);
  const sessionUserId =
    session?.user && "id" in session.user ? String(session.user.id) : undefined;
  const intakeUserId = cookieStore.get("ashfall-agent-id")?.value;

  return resolveStoredAgentId({
    sessionUserId,
    intakeUserId,
  });
}
