import { readFile } from "node:fs/promises";

import { parseCaseAssetRange, resolveCaseAsset } from "@/features/cases/case-asset";

export const runtime = "nodejs";

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
    const asset = await resolveCaseAsset(caseSlug, relativeAssetPath);
    const body = await readFile(asset.filePath);
    const headers = new Headers({
      "content-length": String(body.length),
      "content-type": asset.contentType,
    });

    if (asset.kind === "intro_audio") {
      headers.set("accept-ranges", "bytes");

      const rangeHeader = _request.headers.get("range");

      if (rangeHeader) {
        const range = parseCaseAssetRange(rangeHeader, body.length);

        if (!range) {
          headers.set("content-range", `bytes */${body.length}`);
          headers.set("content-length", "0");
          return new Response(null, {
            status: 416,
            headers,
          });
        }

        const partialBody = body.subarray(range.start, range.end + 1);
        headers.set(
          "content-range",
          `bytes ${range.start}-${range.end}/${body.length}`,
        );
        headers.set("content-length", String(partialBody.length));

        return new Response(partialBody, {
          status: 206,
          headers,
        });
      }
    }

    return new Response(body, {
      status: 200,
      headers,
    });
  } catch {
    return new Response(null, {
      status: 404,
    });
  }
}
