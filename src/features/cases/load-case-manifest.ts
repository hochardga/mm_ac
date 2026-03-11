import { readFile } from "node:fs/promises";
import path from "node:path";

import { caseManifestSchema } from "@/features/cases/case-schema";

function getManifestPath(slug: string) {
  return path.join(process.cwd(), "content", "cases", slug, "manifest.json");
}

export async function loadCaseManifest(slug: string) {
  const raw = await readFile(getManifestPath(slug), "utf8");

  return caseManifestSchema.parse(JSON.parse(raw));
}
