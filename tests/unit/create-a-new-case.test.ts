import { readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "vitest";

test("new case docs mention the introduction folder and replay behavior", async () => {
  const docsPath = path.join(process.cwd(), "docs", "create-a-new-case.md");
  const docs = await readFile(docsPath, "utf8");

  expect(docs).toMatch(/introduction\/transcript\.md/i);
  expect(docs).toMatch(/introduction\/audio\.mp3/i);
  expect(docs).toMatch(/Replay Introduction/i);
  expect(docs).toMatch(/intro=1/i);
  expect(docs).toMatch(/introduction\/.*optional/i);
});
