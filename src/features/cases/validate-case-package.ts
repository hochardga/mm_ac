import { loadAnyCaseManifest } from "@/features/cases/load-case-manifest";
import { loadAnyProtectedCase } from "@/features/cases/load-protected-case";

export async function validateCasePackage(
  slug: string,
  options?: { casesRoot?: string },
) {
  const [manifest, protectedCase] = await Promise.all([
    loadAnyCaseManifest(slug, options),
    loadAnyProtectedCase(slug, options),
  ]);

  return {
    slug: manifest.slug,
    revision: manifest.revision,
    evidenceCount: manifest.evidence.length,
    protectedCase,
  };
}
