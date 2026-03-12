import { randomUUID } from "node:crypto";

import { users } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

test("initializes a local embedded postgres database for tests", async () => {
  const db = await getDb();

  await db.insert(users).values({
    id: randomUUID(),
    email: "agent@example.com",
    passwordHash: "hashed",
    alias: "Agent Ash",
  });

  const records = await db.select().from(users);

  expect(records).toHaveLength(1);
});
