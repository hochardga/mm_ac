import { access, realpath } from "node:fs/promises";
import path from "node:path";

import { resolvePhotoAsset } from "@/features/cases/evidence/photo-asset";
import { assertPathWithinRoot, resolveCaseFilePath } from "@/features/cases/paths";

const PHOTO_ASSET_PREFIX = "evidence/";
const PHOTO_ASSET_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const INTRO_AUDIO_PATH = "introduction/audio.mp3";

export const CASE_INTRODUCTION_AUDIO_PATH = INTRO_AUDIO_PATH;

export type CaseAsset =
  | {
      kind: "photo";
      filePath: string;
      relativePath: string;
      contentType: string;
    }
  | {
      kind: "intro_audio";
      filePath: string;
      relativePath: string;
      contentType: "audio/mpeg";
    };

function isPhotoAssetPath(assetPath: string) {
  return (
    assetPath.startsWith(PHOTO_ASSET_PREFIX) &&
    PHOTO_ASSET_EXTENSIONS.has(path.extname(assetPath).toLowerCase())
  );
}

export async function resolveCaseAsset(
  caseSlug: string,
  assetPath: string,
  options?: { casesRoot?: string },
): Promise<CaseAsset> {
  if (assetPath === INTRO_AUDIO_PATH) {
    const resolved = resolveCaseFilePath(caseSlug, assetPath, {
      casesRoot: options?.casesRoot,
      label: `introduction audio for ${caseSlug}: ${assetPath}`,
    });

    await access(resolved.filePath);
    const realFilePath = await realpath(resolved.filePath);
    const realCaseDir = await realpath(resolved.caseDir);

    assertPathWithinRoot(
      realCaseDir,
      realFilePath,
      `introduction audio for ${caseSlug}: ${assetPath}`,
    );

    return {
      kind: "intro_audio",
      filePath: realFilePath,
      relativePath: path
        .relative(realCaseDir, realFilePath)
        .split(path.sep)
        .join("/"),
      contentType: "audio/mpeg",
    };
  }

  if (isPhotoAssetPath(assetPath)) {
    const photoAsset = await resolvePhotoAsset(caseSlug, assetPath, {
      casesRoot: options?.casesRoot,
    });

    return {
      kind: "photo",
      filePath: photoAsset.filePath,
      relativePath: photoAsset.relativePath,
      contentType: photoAsset.contentType,
    };
  }

  throw new Error(`Unsupported case asset path for ${caseSlug}: ${assetPath}`);
}

export function parseCaseAssetRange(rangeHeader: string, size: number) {
  if (size <= 0) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());

  if (!match) {
    return null;
  }

  const [, startToken, endToken] = match;

  if (startToken === "" && endToken === "") {
    return null;
  }

  if (startToken === "") {
    const suffixLength = Number(endToken);

    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      return null;
    }

    return {
      start: Math.max(size - suffixLength, 0),
      end: size - 1,
    };
  }

  const start = Number(startToken);

  if (!Number.isInteger(start) || start < 0 || start >= size) {
    return null;
  }

  if (endToken === "") {
    return { start, end: size - 1 };
  }

  const end = Number(endToken);

  if (!Number.isInteger(end) || end < start) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}
