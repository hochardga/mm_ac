import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadSystemIntro } from "@/features/the-system-into/load-system-intro";

async function createIntroRoot() {
  return mkdtemp(path.join(os.tmpdir(), "system-intro-"));
}

async function writeTranscript(
  root: string,
  transcript: string | null,
  audio?: string,
) {
  await mkdir(root, { recursive: true });

  if (transcript !== null) {
    await writeFile(path.join(root, "transcript.md"), transcript, "utf8");
  }

  if (audio !== undefined) {
    await writeFile(path.join(root, "audio.mp3"), audio, "utf8");
  }
}

test("loads transcript and optional audio when files are present", async () => {
  const introRoot = await createIntroRoot();
  await writeTranscript(introRoot, "[pause]\nLine two.\n", "audio bytes");

  const intro = await loadSystemIntro({ introRoot });

  expect(intro).toEqual({
    transcript: "[pause]\nLine two.\n",
    audioPath: "audio.mp3",
  });
});

test("returns null when transcript is missing, empty, or unreadable", async () => {
  const missingRoot = await createIntroRoot();
  const emptyRoot = await createIntroRoot();
  const unreadableRoot = await createIntroRoot();
  await writeTranscript(emptyRoot, "  \n\t  ");
  await mkdir(path.join(unreadableRoot, "transcript.md"), { recursive: true });

  await expect(loadSystemIntro({ introRoot: missingRoot })).resolves.toBeNull();
  await expect(loadSystemIntro({ introRoot: emptyRoot })).resolves.toBeNull();
  await expect(loadSystemIntro({ introRoot: unreadableRoot })).resolves.toBeNull();
});

test("returns transcript-only bundle when audio is absent", async () => {
  const introRoot = await createIntroRoot();
  await writeTranscript(introRoot, "Preserve\n\nall spacing.");

  const intro = await loadSystemIntro({ introRoot });

  expect(intro).toEqual({
    transcript: "Preserve\n\nall spacing.",
    audioPath: undefined,
  });
});
