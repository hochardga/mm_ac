import { beforeEach, vi } from "vitest";
import path from "node:path";

const { resolveAudioAssetMock, resolvePhotoAssetMock } = vi.hoisted(
  () => ({
  resolveAudioAssetMock: vi.fn(),
  resolvePhotoAssetMock: vi.fn(),
}),
);

vi.mock("@/features/cases/evidence/audio-asset", () => ({
  resolveAudioAsset: resolveAudioAssetMock,
}));

vi.mock("@/features/cases/evidence/photo-asset", () => ({
  resolvePhotoAsset: resolvePhotoAssetMock,
}));

import { GET } from "@/app/api/cases/[caseSlug]/assets/[...assetPath]/route";

beforeEach(() => {
  resolvePhotoAssetMock.mockReset();
  resolveAudioAssetMock.mockReset();
  resolvePhotoAssetMock.mockImplementation(
    async (_caseSlug: string, assetPath: string) => {
      if (!assetPath.endsWith(".png")) {
        throw new Error("Unsupported asset extension");
      }

      return {
        filePath: path.join(
          process.cwd(),
          "content/cases/hollow-bishop/evidence/vestry-scene-photo.png",
        ),
        contentType: "image/png",
      };
    },
  );
});

test("serves a case photo asset with the correct content type", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      caseSlug: "hollow-bishop",
      assetPath: ["evidence", "vestry-scene-photo.png"],
    }),
  } as never);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toMatch(/image\/png/i);
});

test("returns 404 for unsupported asset extensions", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      caseSlug: "hollow-bishop",
      assetPath: ["evidence", "vestry-scene-photo.txt"],
    }),
  } as never);

  expect(response.status).toBe(404);
});

test("serves an audio asset with the correct content type", async () => {
  resolveAudioAssetMock.mockResolvedValue({
    filePath: path.join(
      process.cwd(),
      "content/cases/hollow-bishop/evidence/vestry-scene-photo.png",
    ),
    contentType: "audio/wav",
  });

  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      caseSlug: "media-family-valid",
      assetPath: ["evidence", "dispatch-voicemail.wav"],
    }),
  } as never);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toMatch(/audio\/wav/i);
});
