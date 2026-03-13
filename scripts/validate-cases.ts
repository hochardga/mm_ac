import { readdir } from "node:fs/promises";
import path from "node:path";

import { validateCasePackage } from "@/features/cases/validate-case-package";

async function main() {
  const casesRoot = path.join(process.cwd(), "content", "cases");
  const slugs = (
    await readdir(casesRoot, {
      withFileTypes: true,
    })
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  await Promise.all(
    slugs.map(async (slug) => {
      await validateCasePackage(slug, { casesRoot });
    }),
  );

  console.log(`Validated ${slugs.length} case packages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
