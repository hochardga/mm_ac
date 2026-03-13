import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { loadProtectedCase } from "@/features/cases/load-protected-case";

export async function validateCasePackage(
  slug: string,
  options?: { casesRoot?: string },
) {
  const manifest = await loadCaseManifest(slug, options);
  const protectedCase = await loadProtectedCase(slug, options);

  return {
    slug: manifest.slug,
    revision: manifest.revision,
    evidenceCount: manifest.evidence.length,
    protectedCase,
  };
}
