import { buildCaseAssetUrl } from "@/features/cases/evidence/case-asset";

export function buildPhotoAssetUrl(caseSlug: string, assetPath: string) {
  return buildCaseAssetUrl(caseSlug, assetPath);
}
