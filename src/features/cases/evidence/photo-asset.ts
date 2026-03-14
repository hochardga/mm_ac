import { access } from "node:fs/promises";
import path from "node:path";

import { resolveCaseFilePath } from "@/features/cases/paths";

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

  return {
    ...resolved,
    contentType,
  };
}

export function buildPhotoAssetUrl(caseSlug: string, assetPath: string) {
  return `/api/cases/${encodeURIComponent(caseSlug)}/assets/${assetPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
