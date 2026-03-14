import { GET } from "@/app/api/cases/[caseSlug]/assets/[...assetPath]/route";

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
