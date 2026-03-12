import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  caseManifestSchema,
  protectedCaseSchema,
} from "@/features/cases/case-schema";

async function main() {
  const casesRoot = path.join(process.cwd(), "content", "cases");
  const slugs = await readdir(casesRoot);

  await Promise.all(
    slugs.map(async (slug) => {
      const manifestPath = path.join(casesRoot, slug, "manifest.json");
      const protectedPath = path.join(casesRoot, slug, "protected.json");

      const manifestRaw = await readFile(manifestPath, "utf8");
      const protectedRaw = await readFile(protectedPath, "utf8");

      caseManifestSchema.parse(JSON.parse(manifestRaw));
      protectedCaseSchema.parse(JSON.parse(protectedRaw));
    }),
  );

  console.log(`Validated ${slugs.length} case packages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
