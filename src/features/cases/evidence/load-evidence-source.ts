import { readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import {
  caseEvidenceSchema,
  type EvidenceIndexEntry,
  documentEvidenceSourceSchema,
  recordEvidenceSourceSchema,
  threadEvidenceSourceSchema,
} from "@/features/cases/evidence/schema";

type LoadEvidenceSourceOptions = {
  caseSlug: string;
  casesRoot: string;
  entry: EvidenceIndexEntry;
};

export async function loadEvidenceSource({
  caseSlug,
  casesRoot,
  entry,
}: LoadEvidenceSourceOptions) {
  const sourcePath = path.join(casesRoot, caseSlug, entry.source);
  const raw = await readFile(sourcePath, "utf8");

  switch (entry.family) {
    case "document": {
      const parsed = matter(raw);
      const source = documentEvidenceSourceSchema.parse({
        subtype: parsed.data.subtype ?? entry.subtype,
        body: parsed.content.trim(),
        meta: parsed.data.meta ?? {},
      });

      if (source.subtype !== entry.subtype) {
        throw new Error(
          `Document evidence subtype mismatch for ${caseSlug}/${entry.id}: expected ${entry.subtype}, received ${source.subtype}`,
        );
      }

      return caseEvidenceSchema.parse({
        ...entry,
        body: source.body,
        meta: source.meta,
      });
    }
    case "record": {
      const source = recordEvidenceSourceSchema.parse(JSON.parse(raw));

      if (source.subtype !== entry.subtype) {
        throw new Error(
          `Record evidence subtype mismatch for ${caseSlug}/${entry.id}: expected ${entry.subtype}, received ${source.subtype}`,
        );
      }

      return caseEvidenceSchema.parse({
        ...entry,
        columns: source.columns,
        rows: source.rows,
      });
    }
    case "thread": {
      const source = threadEvidenceSourceSchema.parse(JSON.parse(raw));

      if (source.subtype !== entry.subtype) {
        throw new Error(
          `Thread evidence subtype mismatch for ${caseSlug}/${entry.id}: expected ${entry.subtype}, received ${source.subtype}`,
        );
      }

      return caseEvidenceSchema.parse({
        ...entry,
        thread: source.thread,
        messages: source.messages,
      });
    }
  }
}
