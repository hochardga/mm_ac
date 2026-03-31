import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadCaseIntroduction } from "@/features/cases/load-case-introduction";

async function createCasesRoot() {
  return mkdtemp(path.join(os.tmpdir(), "case-intro-"));
}

async function writeIntroduction(
  casesRoot: string,
  slug: string,
  transcript: string | null,
) {
  const introDir = path.join(casesRoot, slug, "introduction");
  await mkdir(introDir, { recursive: true });

  if (transcript !== null) {
    await writeFile(path.join(introDir, "transcript.md"), transcript, "utf8");
  }
}

test("returns null when the introduction folder is missing", async () => {
  const casesRoot = await createCasesRoot();
  const intro = await loadCaseIntroduction("missing-intro", { casesRoot });

  expect(intro).toBeNull();
});

test("loads a transcript-only introduction bundle", async () => {
  const casesRoot = await createCasesRoot();
  await writeIntroduction(casesRoot, "transcript-only", "Intro transcript.");

  const intro = await loadCaseIntroduction("transcript-only", { casesRoot });

  expect(intro).toEqual({
    transcript: "Intro transcript.",
    audioPath: undefined,
  });
});

test("returns null when transcript.md is missing or empty", async () => {
  const casesRoot = await createCasesRoot();
  await writeIntroduction(casesRoot, "missing-transcript", null);
  await writeIntroduction(casesRoot, "empty-transcript", "   \n");

  await expect(
    loadCaseIntroduction("missing-transcript", { casesRoot }),
  ).resolves.toBeNull();
  await expect(
    loadCaseIntroduction("empty-transcript", { casesRoot }),
  ).resolves.toBeNull();
});
