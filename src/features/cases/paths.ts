import path from "node:path";

const CASE_SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;

function assertPathWithinRoot(root: string, target: string, label: string) {
  const relativePath = path.relative(root, target);

  if (
    relativePath.startsWith("..") ||
    relativePath.includes(`${path.sep}..`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Invalid ${label}`);
  }
}

export function resolveCasesRoot(customRoot?: string) {
  return path.resolve(customRoot ?? path.join(process.cwd(), "content", "cases"));
}

export function resolveCaseDirectory(slug: string, customRoot?: string) {
  if (!CASE_SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid case slug: ${slug}`);
  }

  const casesRoot = resolveCasesRoot(customRoot);
  const caseDir = path.resolve(casesRoot, slug);

  assertPathWithinRoot(casesRoot, caseDir, `case slug: ${slug}`);

  return {
    casesRoot,
    caseDir,
  };
}

export function resolveCaseFilePath(
  slug: string,
  relativePath: string,
  options?: {
    casesRoot?: string;
    label?: string;
  },
) {
  const { casesRoot, caseDir } = resolveCaseDirectory(slug, options?.casesRoot);
  const filePath = path.resolve(caseDir, relativePath);

  assertPathWithinRoot(
    caseDir,
    filePath,
    options?.label ?? `case file path for ${slug}: ${relativePath}`,
  );

  return {
    casesRoot,
    caseDir,
    filePath,
  };
}
