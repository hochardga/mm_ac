import { resolveCaseAsset } from "@/features/cases/evidence/case-asset";

export async function resolveAudioAsset(
  caseSlug: string,
  assetPath: string,
  options?: { casesRoot?: string },
) {
  return resolveCaseAsset(caseSlug, assetPath, {
    kind: "audio",
    casesRoot: options?.casesRoot,
    label: `audio asset path for ${caseSlug}: ${assetPath}`,
  });
}
