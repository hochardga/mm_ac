import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, expect, test, vi } from "vitest";

import { GET } from "@/app/api/cases/[caseSlug]/assets/[...assetPath]/route";

let tempRoot: string | null = null;

async function createCasesRoot() {
  tempRoot = await realpath(await mkdtemp(path.join(os.tmpdir(), "case-assets-")));
  vi.spyOn(process, "cwd").mockReturnValue(tempRoot);
  return path.join(tempRoot, "content", "cases");
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
  vi.restoreAllMocks();

  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

test("serves intro audio with 200 and 206 responses", async () => {
  const casesRoot = await createCasesRoot();

  await writeCaseAsset(
    casesRoot,
    "larkspur-dead-air",
    "introduction/audio.mp3",
    Buffer.from("abcdef"),
  );

  const fullResponse = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      caseSlug: "larkspur-dead-air",
      assetPath: ["introduction", "audio.mp3"],
    }),
  } as never);

  expect(fullResponse.status).toBe(200);
  expect(fullResponse.headers.get("content-type")).toBe("audio/mpeg");
  expect(fullResponse.headers.get("accept-ranges")).toBe("bytes");
  expect(fullResponse.headers.get("content-length")).toBe("6");
  expect(Buffer.from(await fullResponse.arrayBuffer()).toString("utf8")).toBe(
    "abcdef",
  );

  const rangeResponse = await GET(
    new Request("http://localhost", {
      headers: {
        Range: "bytes=1-3",
      },
    }),
    {
      params: Promise.resolve({
        caseSlug: "larkspur-dead-air",
        assetPath: ["introduction", "audio.mp3"],
      }),
    } as never,
  );

  expect(rangeResponse.status).toBe(206);
  expect(rangeResponse.headers.get("content-type")).toBe("audio/mpeg");
  expect(rangeResponse.headers.get("accept-ranges")).toBe("bytes");
  expect(rangeResponse.headers.get("content-range")).toBe("bytes 1-3/6");
  expect(rangeResponse.headers.get("content-length")).toBe("3");
  expect(Buffer.from(await rangeResponse.arrayBuffer()).toString("utf8")).toBe(
    "bcd",
  );
});

test("returns 416 for invalid range requests", async () => {
  const casesRoot = await createCasesRoot();

  await writeCaseAsset(
    casesRoot,
    "larkspur-dead-air",
    "introduction/audio.mp3",
    Buffer.from("abcdef"),
  );

  const invalidRangeResponse = await GET(
    new Request("http://localhost", {
      headers: {
        Range: "bytes=3-1",
      },
    }),
    {
      params: Promise.resolve({
        caseSlug: "larkspur-dead-air",
        assetPath: ["introduction", "audio.mp3"],
      }),
    } as never,
  );

  expect(invalidRangeResponse.status).toBe(416);
  expect(invalidRangeResponse.headers.get("content-range")).toBe("bytes */6");

  const unsatisfiableRangeResponse = await GET(
    new Request("http://localhost", {
      headers: {
        Range: "bytes=999-1000",
      },
    }),
    {
      params: Promise.resolve({
        caseSlug: "larkspur-dead-air",
        assetPath: ["introduction", "audio.mp3"],
      }),
    } as never,
  );

  expect(unsatisfiableRangeResponse.status).toBe(416);
  expect(unsatisfiableRangeResponse.headers.get("content-range")).toBe(
    "bytes */6",
  );
});

test("serves a case photo asset with the correct content type", async () => {
  const casesRoot = await createCasesRoot();

  await writeCaseAsset(
    casesRoot,
    "hollow-bishop",
    "evidence/vestry-scene-photo.png",
    Buffer.from("fake-png"),
  );

  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      caseSlug: "hollow-bishop",
      assetPath: ["evidence", "vestry-scene-photo.png"],
    }),
  } as never);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toBe(
    "fake-png",
  );
});

test("returns 404 for unsupported asset extensions", async () => {
  const casesRoot = await createCasesRoot();

  await writeCaseAsset(
    casesRoot,
    "hollow-bishop",
    "evidence/vestry-scene-photo.txt",
    "not-a-photo",
  );

  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      caseSlug: "hollow-bishop",
      assetPath: ["evidence", "vestry-scene-photo.txt"],
    }),
  } as never);

  expect(response.status).toBe(404);
});
