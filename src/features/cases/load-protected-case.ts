import { readFile } from "node:fs/promises";

import {
  legacyProtectedCaseSchema,
  protectedCaseSchema,
  stagedProtectedCaseSchema,
  type LegacyProtectedCase,
  type ProtectedCase,
  type StagedProtectedCase,
} from "@/features/cases/case-schema";
import { resolveCaseFilePath } from "@/features/cases/paths";

type LoadProtectedCaseOptions = {
  casesRoot?: string;
  expectedRevision?: string;
};

async function loadProtectedPayload<TPayload extends ProtectedCase>(
  slug: string,
  options: LoadProtectedCaseOptions | undefined,
  parser: (payload: unknown) => TPayload,
): Promise<TPayload> {
  const { filePath } = resolveCaseFilePath(slug, "protected.json", {
    casesRoot: options?.casesRoot,
  });
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const payload = parser(parsed);

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

export async function loadProtectedCase(
  slug: string,
  options?: LoadProtectedCaseOptions,
): Promise<LegacyProtectedCase> {
  return loadProtectedPayload(slug, options, legacyProtectedCaseSchema.parse);
}

export async function loadStagedProtectedCase(
  slug: string,
  options?: LoadProtectedCaseOptions,
): Promise<StagedProtectedCase> {
  return loadProtectedPayload(slug, options, stagedProtectedCaseSchema.parse);
}

export async function loadAnyProtectedCase(
  slug: string,
  options?: LoadProtectedCaseOptions,
): Promise<ProtectedCase> {
  return loadProtectedPayload(slug, options, protectedCaseSchema.parse);
}
