export function buildCaseAssetUrl(caseSlug: string, assetPath: string) {
  return `/api/cases/${encodeURIComponent(caseSlug)}/assets/${assetPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
