import { readFile } from "node:fs/promises";
import path from "node:path";

import { protectedCaseSchema } from "@/features/cases/case-schema";

function getCasesRoot(customRoot?: string) {
  return customRoot ?? path.join(process.cwd(), "content", "cases");
}

function getProtectedPath(casesRoot: string, slug: string) {
  return path.join(casesRoot, slug, "protected.json");
}

export async function loadProtectedCase(
  slug: string,
  options?: { casesRoot?: string },
) {
  const casesRoot = getCasesRoot(options?.casesRoot);
  const raw = await readFile(getProtectedPath(casesRoot, slug), "utf8");

  return protectedCaseSchema.parse(JSON.parse(raw));
}
