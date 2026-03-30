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

const AUDIO_CONTENT_TYPES = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
} as const;

const CASE_ASSET_CONTENT_TYPES = {
  photo: PHOTO_CONTENT_TYPES,
  audio: AUDIO_CONTENT_TYPES,
} as const;

export type CaseAssetKind = keyof typeof CASE_ASSET_CONTENT_TYPES;
export type SupportedPhotoExtension = keyof typeof PHOTO_CONTENT_TYPES;
export type SupportedAudioExtension = keyof typeof AUDIO_CONTENT_TYPES;

export function isAudioAssetPath(assetPath: string) {
  const ext = path.extname(assetPath).toLowerCase();

  return ext in AUDIO_CONTENT_TYPES;
}

export async function resolveCaseAsset(
  caseSlug: string,
  assetPath: string,
  options: {
    kind: CaseAssetKind;
    label: string;
    casesRoot?: string;
  },
) {
  const resolved = resolveCaseFilePath(caseSlug, assetPath, {
    casesRoot: options.casesRoot,
    label: options.label,
  });
  const ext = path.extname(resolved.filePath).toLowerCase();
  const contentType =
    options.kind === "audio"
      ? AUDIO_CONTENT_TYPES[ext as SupportedAudioExtension]
      : PHOTO_CONTENT_TYPES[ext as SupportedPhotoExtension];

  if (!contentType) {
    throw new Error(
      `Unsupported ${options.kind} asset extension for ${caseSlug}: ${assetPath}`,
    );
  }

  await access(resolved.filePath);
  const realFilePath = await realpath(resolved.filePath);

  assertPathWithinRoot(resolved.caseDir, realFilePath, options.label);

  return {
    ...resolved,
    filePath: realFilePath,
    relativePath: path
      .relative(resolved.caseDir, realFilePath)
      .split(path.sep)
      .join("/"),
    contentType,
  };
}

export function buildCaseAssetUrl(caseSlug: string, assetPath: string) {
  return `/api/cases/${encodeURIComponent(caseSlug)}/assets/${assetPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
