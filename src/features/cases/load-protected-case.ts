import { readFile } from "node:fs/promises";

import { protectedCaseSchema } from "@/features/cases/case-schema";
import { resolveCaseFilePath } from "@/features/cases/paths";

type LoadProtectedCaseOptions = {
  casesRoot?: string;
  expectedRevision?: string;
};

export async function loadProtectedCase(
  slug: string,
  options?: LoadProtectedCaseOptions,
) {
  const { filePath } = resolveCaseFilePath(slug, "protected.json", {
    casesRoot: options?.casesRoot,
  });
  const raw = await readFile(filePath, "utf8");
  const payload = protectedCaseSchema.parse(JSON.parse(raw));

  if (
    options?.expectedRevision &&
    payload.revision !== options.expectedRevision
  ) {
    throw new Error(
      `Protected case revision ${payload.revision} does not match expected revision ${options.expectedRevision}`,
    );
  }

  return payload;
}
