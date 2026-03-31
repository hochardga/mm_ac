import { buildCaseAssetUrl } from "@/features/cases/case-asset-url";

export function buildPhotoAssetUrl(caseSlug: string, assetPath: string) {
  return buildCaseAssetUrl(caseSlug, assetPath);
}
