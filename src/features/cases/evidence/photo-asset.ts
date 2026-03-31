import { access, realpath } from "node:fs/promises";
import path from "node:path";

import {
  assertPathWithinRoot,
  resolveCaseFilePath,
} from "@/features/cases/paths";

const PHOTO_CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
} as const;

export type SupportedPhotoExtension = keyof typeof PHOTO_CONTENT_TYPES;

export async function resolvePhotoAsset(
  caseSlug: string,
  assetPath: string,
  options?: { casesRoot?: string },
) {
  const resolved = resolveCaseFilePath(caseSlug, assetPath, {
    casesRoot: options?.casesRoot,
    label: `photo image path for ${caseSlug}: ${assetPath}`,
  });
  const ext = path.extname(resolved.filePath).toLowerCase() as SupportedPhotoExtension;
  const contentType = PHOTO_CONTENT_TYPES[ext];

  if (!contentType) {
    throw new Error(`Unsupported photo asset extension for ${caseSlug}: ${assetPath}`);
  }

  await access(resolved.filePath);
  const realFilePath = await realpath(resolved.filePath);
  const realCaseDir = await realpath(resolved.caseDir);

  assertPathWithinRoot(
    realCaseDir,
    realFilePath,
    `photo image path for ${caseSlug}: ${assetPath}`,
  );

  return {
    ...resolved,
    filePath: realFilePath,
    relativePath: path.relative(realCaseDir, realFilePath).split(path.sep).join("/"),
    contentType,
  };
}
