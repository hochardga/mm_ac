import * as fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, expect, test, vi } from "vitest";

import { GET } from "@/app/api/the-system-intro/audio/route";

let tempRoot: string | null = null;

async function createRepoRoot() {
  tempRoot = await fsPromises.realpath(
    await fsPromises.mkdtemp(path.join(os.tmpdir(), "system-intro-audio-")),
  );
  vi.spyOn(process, "cwd").mockReturnValue(tempRoot);
  return tempRoot;
}

async function writeAudio(repoRoot: string, contents: Buffer | string) {
  const filePath = path.join(repoRoot, "content", "the-system-intro", "audio.mp3");
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  await fsPromises.writeFile(filePath, contents);
  return filePath;
}

afterEach(async () => {
  vi.restoreAllMocks();

  if (tempRoot) {
    await fsPromises.rm(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

test("serves the narration audio when the file exists", async () => {
  const repoRoot = await createRepoRoot();
  await writeAudio(repoRoot, Buffer.from("abcdef"));

  const response = await GET(new Request("http://localhost/api/the-system-intro/audio"));

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("audio/mpeg");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("accept-ranges")).toBe("bytes");
  expect(response.headers.get("content-length")).toBe("6");
  expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toBe("abcdef");
});

test("serves partial content for byte range requests", async () => {
  const repoRoot = await createRepoRoot();
  await writeAudio(repoRoot, Buffer.from("abcdef"));

  const response = await GET(
    new Request("http://localhost/api/the-system-intro/audio", {
      headers: {
        range: "bytes=1-3",
      },
    }),
  );

  expect(response.status).toBe(206);
  expect(response.headers.get("content-type")).toBe("audio/mpeg");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("accept-ranges")).toBe("bytes");
  expect(response.headers.get("content-range")).toBe("bytes 1-3/6");
  expect(response.headers.get("content-length")).toBe("3");
  expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toBe("bcd");
});

test("returns 404 when the narration file is missing", async () => {
  await createRepoRoot();

  const response = await GET(new Request("http://localhost/api/the-system-intro/audio"));

  expect(response.status).toBe(404);
});

test("returns 500 for non-missing file failures", async () => {
  const repoRoot = await createRepoRoot();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const filePath = await writeAudio(repoRoot, Buffer.from("abcdef"));
  await fsPromises.chmod(filePath, 0o000);

  const response = await GET(new Request("http://localhost/api/the-system-intro/audio"));

  expect(response.status).toBe(500);
  expect(consoleErrorSpy).toHaveBeenCalled();
});
