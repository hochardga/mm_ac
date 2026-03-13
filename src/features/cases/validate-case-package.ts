import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { loadProtectedCase } from "@/features/cases/load-protected-case";

export async function validateCasePackage(
  slug: string,
  options?: { casesRoot?: string },
) {
  const [manifest, protectedCase] = await Promise.all([
    loadCaseManifest(slug, options),
    loadProtectedCase(slug, options),
  ]);

  return {
    slug: manifest.slug,
    revision: manifest.revision,
    evidenceCount: manifest.evidence.length,
    protectedCase,
  };
}
