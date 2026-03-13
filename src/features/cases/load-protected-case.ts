import { readFile } from "node:fs/promises";

import { protectedCaseSchema } from "@/features/cases/case-schema";
import { resolveCaseFilePath } from "@/features/cases/paths";

export async function loadProtectedCase(
  slug: string,
  options?: { casesRoot?: string },
) {
  const { filePath } = resolveCaseFilePath(slug, "protected.json", {
    casesRoot: options?.casesRoot,
  });
  const raw = await readFile(filePath, "utf8");

  return protectedCaseSchema.parse(JSON.parse(raw));
}
