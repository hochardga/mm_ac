import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, expect, test, vi } from "vitest";

import { GET } from "@/app/api/the-system-intro/audio/route";

let tempRoot: string | null = null;

async function createRepoRoot() {
  tempRoot = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "system-intro-audio-")),
  );
  vi.spyOn(process, "cwd").mockReturnValue(tempRoot);
  return tempRoot;
}

async function writeAudio(repoRoot: string, contents: Buffer | string) {
  const filePath = path.join(repoRoot, "content", "the-system-intro", "audio.mp3");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
  return filePath;
}

afterEach(async () => {
  vi.restoreAllMocks();

  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

test("serves the narration audio when the file exists", async () => {
  const repoRoot = await createRepoRoot();
  await writeAudio(repoRoot, Buffer.from("abcdef"));

  const response = await GET();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("audio/mpeg");
  expect(response.headers.get("content-length")).toBe("6");
  expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toBe("abcdef");
});

test("returns 404 when the narration file is missing", async () => {
  await createRepoRoot();

  const response = await GET();

  expect(response.status).toBe(404);
});
