import { buildCaseAssetUrl } from "@/features/cases/evidence/case-asset";

export function buildAudioAssetUrl(caseSlug: string, assetPath: string) {
  return buildCaseAssetUrl(caseSlug, assetPath);
}
