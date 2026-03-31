import { caseDefinitions } from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  await closeDb();
});

async function countPublishedCases() {
  const db = await getDb();
  const cases = await db.select().from(caseDefinitions);

  return cases.filter((definition) => definition.currentPublishedRevision.length > 0)
    .length;
}

test("seeds five published cases", async () => {
  await seedDatabase();

  await expect(countPublishedCases()).resolves.toBe(5);
});
