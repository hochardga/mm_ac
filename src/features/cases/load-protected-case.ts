import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { protectedCaseSchema } from "@/features/cases/case-schema";

function getProtectedPath(slug: string) {
  return path.join(process.cwd(), "content", "cases", slug, "protected.json");
}

export async function loadProtectedCase(slug: string) {
  const raw = await readFile(getProtectedPath(slug), "utf8");

  return protectedCaseSchema.parse(JSON.parse(raw));
}
