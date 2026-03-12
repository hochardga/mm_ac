import { count } from "drizzle-orm";
import { pathToFileURL } from "node:url";

import { caseDefinitions } from "@/db/schema";
import { syncCaseDefinitions } from "@/features/cases/sync-case-definitions";
import { closeDb, getDb } from "@/lib/db";

export async function seedDatabase() {
  const db = await getDb();

  await syncCaseDefinitions(db);
}

async function runSeed() {
  await seedDatabase();

  const db = await getDb();
  const [result] = await db.select({ count: count() }).from(caseDefinitions);

  console.log(`Seeded ${Number(result?.count ?? 0)} published cases.`);
  await closeDb();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSeed().catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
  });
}
