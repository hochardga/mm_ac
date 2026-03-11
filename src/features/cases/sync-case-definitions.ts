import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import { caseDefinitions } from "@/db/schema";
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { getDb } from "@/lib/db";

type DbClient = Awaited<ReturnType<typeof getDb>>;
type TransactionClient = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T,
  ...args: never[]
) => Promise<unknown>
  ? T
  : never;

type CaseDefinitionWriter = DbClient | TransactionClient;

async function listAuthoredCaseSlugs() {
  const authoredCasesRoot = path.join(process.cwd(), "content", "cases");
  const entries = await readdir(authoredCasesRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function ensureCaseDefinition(
  db: CaseDefinitionWriter,
  caseSlug: string,
) {
  const manifest = await loadCaseManifest(caseSlug);
  const existingDefinition = await db.query.caseDefinitions.findFirst({
    where: eq(caseDefinitions.slug, caseSlug),
  });

  if (existingDefinition) {
    if (
      existingDefinition.title === manifest.title &&
      existingDefinition.currentPublishedRevision === manifest.revision
    ) {
      return existingDefinition;
    }

    const [updatedDefinition] = await db
      .update(caseDefinitions)
      .set({
        title: manifest.title,
        currentPublishedRevision: manifest.revision,
      })
      .where(eq(caseDefinitions.id, existingDefinition.id))
      .returning();

    return updatedDefinition;
  }

  const [createdDefinition] = await db
    .insert(caseDefinitions)
    .values({
      id: randomUUID(),
      slug: manifest.slug,
      title: manifest.title,
      currentPublishedRevision: manifest.revision,
    })
    .returning();

  return createdDefinition;
}

export async function syncCaseDefinitions(db: DbClient) {
  const authoredSlugs = await listAuthoredCaseSlugs();

  await Promise.all(
    authoredSlugs.map((caseSlug) => ensureCaseDefinition(db, caseSlug)),
  );
}
