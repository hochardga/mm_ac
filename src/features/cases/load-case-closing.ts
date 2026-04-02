import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { resolveCaseFilePath } from "@/features/cases/paths";
import type { DebriefStatus } from "@/features/debrief/get-debrief";

type LoadCaseClosingOptions = {
  casesRoot?: string;
};

export type CaseClosingBundle = {
  transcript: string;
  audioPath?: string;
};

function toClosingFolder(status: DebriefStatus) {
  return status === "completed" ? "solved" : "closed-unsolved";
}

export async function loadCaseClosing(
  slug: string,
  status: DebriefStatus,
  options?: LoadCaseClosingOptions,
): Promise<CaseClosingBundle | null> {
  const closingFolder = toClosingFolder(status);
  const transcriptPath = resolveCaseFilePath(
    slug,
    `closing/${closingFolder}/transcript.md`,
    {
      casesRoot: options?.casesRoot,
      label: `closing transcript for ${slug} (${closingFolder})`,
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

  for (const audioFileName of ["audio.mp3", "audio.m4a"]) {
    try {
      const { caseDir, filePath } = resolveCaseFilePath(
        slug,
        `closing/${closingFolder}/${audioFileName}`,
        {
          casesRoot: options?.casesRoot,
          label: `closing audio for ${slug} (${closingFolder})`,
        },
      );
      await access(filePath);
      audioPath = path.relative(caseDir, filePath).split(path.sep).join("/");
      break;
    } catch {
      audioPath = undefined;
    }
  }

  return {
    transcript,
    audioPath,
  };
}
