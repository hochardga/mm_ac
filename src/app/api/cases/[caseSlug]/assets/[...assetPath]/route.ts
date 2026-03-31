import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

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
    const { size } = await stat(asset.filePath);
    const headers = new Headers({
      "content-length": String(size),
      "content-type": asset.contentType,
    });

    if (asset.kind === "intro_audio") {
      headers.set("accept-ranges", "bytes");

      const rangeHeader = _request.headers.get("range");

      if (rangeHeader) {
        const range = parseCaseAssetRange(rangeHeader, size);

        if (!range) {
          headers.set("content-range", `bytes */${size}`);
          headers.set("content-length", "0");
          return new Response(null, {
            status: 416,
            headers,
          });
        }

        headers.set(
          "content-range",
          `bytes ${range.start}-${range.end}/${size}`,
        );
        headers.set("content-length", String(range.end - range.start + 1));

        const partialStream = createReadStream(asset.filePath, {
          start: range.start,
          end: range.end,
        });
        return new Response(Readable.toWeb(partialStream) as unknown as BodyInit, {
          status: 206,
          headers,
        });
      }
    }

    const fullStream = createReadStream(asset.filePath);
    return new Response(Readable.toWeb(fullStream) as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch {
    return new Response(null, {
      status: 404,
    });
  }
}
