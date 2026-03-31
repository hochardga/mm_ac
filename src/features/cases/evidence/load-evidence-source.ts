import { readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import {
  audioEvidenceSourceSchema,
  caseEvidenceSchema,
  diagramEvidenceSourceSchema,
  type EvidenceIndexEntry,
  documentEvidenceSourceSchema,
  photoEvidenceSourceSchema,
  recordEvidenceSourceSchema,
  threadEvidenceSourceSchema,
  webpageEvidenceSourceSchema,
} from "@/features/cases/evidence/schema";
import { resolveAudioAsset } from "@/features/cases/evidence/audio-asset";
import { resolvePhotoAsset } from "@/features/cases/evidence/photo-asset";
import { resolveCaseFilePath } from "@/features/cases/paths";

type LoadEvidenceSourceOptions = {
  caseSlug: string;
  casesRoot: string;
  entry: EvidenceIndexEntry;
};

function assertSubtypeMatch(
  caseSlug: string,
  entry: EvidenceIndexEntry,
  source: { subtype: string },
) {
  if (source.subtype !== entry.subtype) {
    throw new Error(
      `${entry.family[0].toUpperCase()}${entry.family.slice(1)} evidence subtype mismatch for ${caseSlug}/${entry.id}: expected ${entry.subtype}, received ${source.subtype}`,
    );
  }
}

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

      assertSubtypeMatch(caseSlug, entry, source);

      return caseEvidenceSchema.parse({
        ...entry,
        body: source.body,
        meta: source.meta,
      });
    }
    case "record": {
      const source = recordEvidenceSourceSchema.parse(JSON.parse(raw));

      assertSubtypeMatch(caseSlug, entry, source);

      return caseEvidenceSchema.parse({
        ...entry,
        columns: source.columns,
        rows: source.rows,
      });
    }
    case "thread": {
      const source = threadEvidenceSourceSchema.parse(JSON.parse(raw));

      assertSubtypeMatch(caseSlug, entry, source);

      return caseEvidenceSchema.parse({
        ...entry,
        thread: source.thread,
        messages: source.messages,
      });
    }
    case "photo": {
      const source = photoEvidenceSourceSchema.parse(JSON.parse(raw));

      assertSubtypeMatch(caseSlug, entry, source);

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
    case "audio": {
      const source = audioEvidenceSourceSchema.parse(JSON.parse(raw));

      assertSubtypeMatch(caseSlug, entry, source);

      const resolvedAsset = await resolveAudioAsset(caseSlug, source.audio, {
        casesRoot,
      });

      return caseEvidenceSchema.parse({
        ...entry,
        audio: resolvedAsset.relativePath,
        transcript: source.transcript,
        sourceLabel: source.sourceLabel,
        date: source.date,
        durationSeconds: source.durationSeconds,
      });
    }
    case "diagram": {
      const source = diagramEvidenceSourceSchema.parse(JSON.parse(raw));

      assertSubtypeMatch(caseSlug, entry, source);

      return caseEvidenceSchema.parse({
        ...entry,
        viewport: source.viewport,
        elements: source.elements,
        legend: source.legend,
      });
    }
    case "webpage": {
      const source = webpageEvidenceSourceSchema.parse(JSON.parse(raw));

      assertSubtypeMatch(caseSlug, entry, source);

      return caseEvidenceSchema.parse({
        ...entry,
        page: source.page,
        blocks: source.blocks,
      });
    }
  }
}
