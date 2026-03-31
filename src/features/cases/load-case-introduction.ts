import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { resolveCaseFilePath } from "@/features/cases/paths";

type LoadCaseIntroductionOptions = {
  casesRoot?: string;
};

export type CaseIntroductionBundle = {
  transcript: string;
  audioPath?: string;
};

export async function loadCaseIntroduction(
  slug: string,
  options?: LoadCaseIntroductionOptions,
): Promise<CaseIntroductionBundle | null> {
  const transcriptPath = resolveCaseFilePath(
    slug,
    "introduction/transcript.md",
    {
      casesRoot: options?.casesRoot,
      label: `introduction transcript for ${slug}`,
    },
  ).filePath;

  let transcript: string;

  try {
    transcript = (await readFile(transcriptPath, "utf8")).trim();
  } catch {
    return null;
  }

  if (!transcript) {
    return null;
  }

  let audioPath: string | undefined;

  try {
    const { caseDir, filePath } = resolveCaseFilePath(
      slug,
      "introduction/audio.mp3",
      {
        casesRoot: options?.casesRoot,
        label: `introduction audio for ${slug}`,
      },
    );
    await access(filePath);
    audioPath = path.relative(caseDir, filePath).split(path.sep).join("/");
  } catch {
    audioPath = undefined;
  }

  return {
    transcript,
    audioPath,
  };
}
