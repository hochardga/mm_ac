import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

function resolveNarrationPath() {
  return path.join(process.cwd(), "content", "the-system-into", "audio.mp3");
}

export async function GET() {
  try {
    const filePath = resolveNarrationPath();
    const { size } = await stat(filePath);

    const headers = new Headers({
      "content-length": String(size),
      "content-type": "audio/mpeg",
    });

    const stream = createReadStream(filePath);
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

