import { resolveCaseAsset } from "@/features/cases/evidence/case-asset";

export async function resolvePhotoAsset(
  caseSlug: string,
  assetPath: string,
  options?: { casesRoot?: string },
) {
  return resolveCaseAsset(caseSlug, assetPath, {
    kind: "photo",
    casesRoot: options?.casesRoot,
    label: `photo image path for ${caseSlug}: ${assetPath}`,
  });
}

export type { SupportedPhotoExtension } from "@/features/cases/evidence/case-asset";
