import { readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import {
  caseEvidenceSchema,
  type EvidenceIndexEntry,
  documentEvidenceSourceSchema,
  photoEvidenceSourceSchema,
  recordEvidenceSourceSchema,
  threadEvidenceSourceSchema,
} from "@/features/cases/evidence/schema";
import { resolvePhotoAsset } from "@/features/cases/evidence/photo-asset";
import { resolveCaseFilePath } from "@/features/cases/paths";

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
  const { filePath: sourcePath } = resolveCaseFilePath(caseSlug, entry.source, {
    casesRoot,
    label: `evidence source path for ${caseSlug}: ${entry.source}`,
  });
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
    case "photo": {
      const source = photoEvidenceSourceSchema.parse(JSON.parse(raw));

      if (source.subtype !== entry.subtype) {
        throw new Error(
          `Photo evidence subtype mismatch for ${caseSlug}/${entry.id}: expected ${entry.subtype}, received ${source.subtype}`,
        );
      }

      const resolvedAsset = await resolvePhotoAsset(caseSlug, source.image, {
        casesRoot,
      });

      return caseEvidenceSchema.parse({
        ...entry,
        image: resolvedAsset.relativePath,
        caption: source.caption,
        sourceLabel: source.sourceLabel,
        date: source.date,
      });
    }
  }
}
