import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveAudioAsset } from "@/features/cases/evidence/audio-asset";
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
    const ext = path.extname(relativeAssetPath).toLowerCase();
    const resolver =
      ext === ".mp3" || ext === ".wav" || ext === ".m4a"
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
