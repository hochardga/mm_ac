import { constants as fsConstants, createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { parseCaseAssetRange } from "@/features/cases/case-asset";

export const runtime = "nodejs";

function resolveNarrationPath() {
  return path.join(process.cwd(), "content", "the-system-intro", "audio.mp3");
}

function isMissingAudioFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export async function GET(request: Request) {
  try {
    const filePath = resolveNarrationPath();
    await access(filePath, fsConstants.R_OK);
    const { size } = await stat(filePath);

    const headers = new Headers({
      "accept-ranges": "bytes",
      "cache-control": "private, no-store",
      "content-length": String(size),
      "content-type": "audio/mpeg",
    });

    const rangeHeader = request.headers.get("range");

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

      headers.set("content-range", `bytes ${range.start}-${range.end}/${size}`);
      headers.set("content-length", String(range.end - range.start + 1));

      const partialStream = createReadStream(filePath, {
        start: range.start,
        end: range.end,
      });

      return new Response(Readable.toWeb(partialStream) as unknown as BodyInit, {
        status: 206,
        headers,
      });
    }

    const stream = createReadStream(filePath);
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (isMissingAudioFileError(error)) {
      return new Response(null, { status: 404 });
    }

    console.error("Failed to serve system intro audio", error);
    return new Response(null, { status: 500 });
  }
}
