import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadCaseClosing } from "@/features/cases/load-case-closing";

async function createCasesRoot() {
  return mkdtemp(path.join(os.tmpdir(), "case-closing-"));
}

async function writeClosingBundle(
  casesRoot: string,
  slug: string,
  statusFolder: "solved" | "closed-unsolved",
  transcript: string | null,
  audioFileName?: "audio.mp3" | "audio.m4a",
) {
  const closingDir = path.join(casesRoot, slug, "closing", statusFolder);
  await mkdir(closingDir, { recursive: true });

  if (transcript !== null) {
    await writeFile(path.join(closingDir, "transcript.md"), transcript, "utf8");
  }

  if (audioFileName) {
    await writeFile(
      path.join(closingDir, audioFileName),
      "audio bytes",
      "utf8",
    );
  }
}

test("returns null when the closing folder is missing", async () => {
  const casesRoot = await createCasesRoot();
  const closing = await loadCaseClosing("missing-closing", "completed", {
    casesRoot,
  });

  expect(closing).toBeNull();
});

test("loads a solved closing bundle with transcript and optional audio", async () => {
  const casesRoot = await createCasesRoot();
  await writeClosingBundle(
    casesRoot,
    "solved-closing",
    "solved",
    "Solved closing transcript.",
    "audio.mp3",
  );

  const closing = await loadCaseClosing("solved-closing", "completed", {
    casesRoot,
  });

  expect(closing).toEqual({
    transcript: "Solved closing transcript.",
    audioPath: "closing/solved/audio.mp3",
  });
});

test("loads a solved closing bundle with m4a audio fallback", async () => {
  const casesRoot = await createCasesRoot();
  await writeClosingBundle(
    casesRoot,
    "solved-m4a",
    "solved",
    "Solved m4a closing transcript.",
    "audio.m4a",
  );

  const closing = await loadCaseClosing("solved-m4a", "completed", {
    casesRoot,
  });

  expect(closing).toEqual({
    transcript: "Solved m4a closing transcript.",
    audioPath: "closing/solved/audio.m4a",
  });
});

test("loads a closed-unsolved closing bundle with transcript-only fallback", async () => {
  const casesRoot = await createCasesRoot();
  await writeClosingBundle(
    casesRoot,
    "closed-closing",
    "closed-unsolved",
    "Closed-unsolved closing transcript.",
  );

  const closing = await loadCaseClosing(
    "closed-closing",
    "closed_unsolved",
    { casesRoot },
  );

  expect(closing).toEqual({
    transcript: "Closed-unsolved closing transcript.",
    audioPath: undefined,
  });
});

test("returns null when transcript.md is missing or empty", async () => {
  const casesRoot = await createCasesRoot();
  await writeClosingBundle(casesRoot, "missing-transcript", "solved", null);
  await writeClosingBundle(casesRoot, "empty-transcript", "solved", "   \n");

  await expect(
    loadCaseClosing("missing-transcript", "completed", { casesRoot }),
  ).resolves.toBeNull();
  await expect(
    loadCaseClosing("empty-transcript", "completed", { casesRoot }),
  ).resolves.toBeNull();
});
