import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, expect, test } from "vitest";

import {
  parseCaseAssetRange,
  resolveCaseAsset,
} from "@/features/cases/case-asset";
import { buildCaseAssetUrl } from "@/features/cases/case-asset-url";

let tempCasesRoot: string | null = null;

async function createCasesRoot() {
  tempCasesRoot = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "case-asset-")),
  );
  return tempCasesRoot;
}

async function writeCaseAsset(
  casesRoot: string,
  caseSlug: string,
  relativePath: string,
  contents: Buffer | string,
) {
  const filePath = path.join(casesRoot, caseSlug, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
  return filePath;
}

afterEach(async () => {
  if (tempCasesRoot) {
    await rm(tempCasesRoot, { recursive: true, force: true });
    tempCasesRoot = null;
  }
});

test("buildCaseAssetUrl preserves case asset paths", () => {
  expect(buildCaseAssetUrl("red-harbor", "introduction/audio.mp3")).toBe(
    "/api/cases/red-harbor/assets/introduction/audio.mp3",
  );
});

test("resolveCaseAsset loads intro audio and photo assets", async () => {
  const casesRoot = await createCasesRoot();

  await writeCaseAsset(
    casesRoot,
    "larkspur-dead-air",
    "introduction/audio.mp3",
    Buffer.from("abcdef"),
  );
  await writeCaseAsset(
    casesRoot,
    "larkspur-dead-air",
    "evidence/studio-b-scene.png",
    Buffer.from("fake-png"),
  );

  const introAsset = await resolveCaseAsset(
    "larkspur-dead-air",
    "introduction/audio.mp3",
    { casesRoot },
  );
  const photoAsset = await resolveCaseAsset(
    "larkspur-dead-air",
    "evidence/studio-b-scene.png",
    { casesRoot },
  );

  expect(introAsset).toMatchObject({
    kind: "intro_audio",
    contentType: "audio/mpeg",
    relativePath: "introduction/audio.mp3",
  });
  expect(photoAsset).toMatchObject({
    kind: "photo",
    contentType: "image/png",
    relativePath: "evidence/studio-b-scene.png",
  });
});

test("parseCaseAssetRange parses standard byte ranges", () => {
  expect(parseCaseAssetRange("bytes=1-3", 6)).toEqual({ start: 1, end: 3 });
  expect(parseCaseAssetRange("bytes=3-", 6)).toEqual({ start: 3, end: 5 });
  expect(parseCaseAssetRange("bytes=-2", 6)).toEqual({ start: 4, end: 5 });
  expect(parseCaseAssetRange("bytes=999-1000", 6)).toBeNull();
  expect(parseCaseAssetRange("garbage", 6)).toBeNull();
});
