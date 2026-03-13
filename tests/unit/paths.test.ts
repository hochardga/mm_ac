import path from "node:path";

import { resolveCaseFilePath } from "@/features/cases/paths";

test("allows in-root filenames that begin with two dots", () => {
  const result = resolveCaseFilePath("fixture-case", "evidence/..notes.md", {
    casesRoot: "/repo/content/cases",
  });

  expect(result.filePath).toBe(
    path.join("/repo/content/cases", "fixture-case", "evidence", "..notes.md"),
  );
});

test("rejects actual parent-directory traversal segments", () => {
  expect(() =>
    resolveCaseFilePath("fixture-case", "evidence/../../secret.md", {
      casesRoot: "/repo/content/cases",
    }),
  ).toThrow(/invalid/i);
});
