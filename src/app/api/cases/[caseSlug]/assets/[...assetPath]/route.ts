import { readFile } from "node:fs/promises";

import { resolveAudioAsset } from "@/features/cases/evidence/audio-asset";
import { isAudioAssetPath } from "@/features/cases/evidence/case-asset";
import { resolvePhotoAsset } from "@/features/cases/evidence/photo-asset";

type CaseAssetRouteContext = {
  params: Promise<{
    caseSlug: string;
    assetPath: string[];
  }>;
};

export async function GET(
  _request: Request,
  context: CaseAssetRouteContext,
) {
  try {
    const { caseSlug, assetPath } = await context.params;
    const relativeAssetPath = assetPath.join("/");
    const resolver = isAudioAssetPath(relativeAssetPath)
      ? resolveAudioAsset
      : resolvePhotoAsset;
    const { contentType, filePath } = await resolver(caseSlug, relativeAssetPath);
    const body = await readFile(filePath);

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return new Response(null, {
      status: 404,
    });
  }
}
