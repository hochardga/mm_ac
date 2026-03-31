import { access, readFile } from "node:fs/promises";
import path from "node:path";

type LoadSystemIntroOptions = {
  introRoot?: string;
};

export type SystemIntroBundle = {
  transcript: string;
  audioPath?: string;
};

function resolveIntroRoot(customRoot?: string) {
  return path.resolve(
    customRoot ?? path.join(process.cwd(), "content", "the-system-intro"),
  );
}

export async function loadSystemIntro(
  options?: LoadSystemIntroOptions,
): Promise<SystemIntroBundle | null> {
  const introRoot = resolveIntroRoot(options?.introRoot);
  const transcriptPath = path.join(introRoot, "transcript.md");

  let transcript: string;

  try {
    transcript = await readFile(transcriptPath, "utf8");
  } catch {
    return null;
  }

  if (!transcript.trim()) {
    return null;
  }

  const audioPath = path.join(introRoot, "audio.mp3");

  try {
    await access(audioPath);
    return {
      transcript,
      audioPath: "audio.mp3",
    };
  } catch {
    return {
      transcript,
      audioPath: undefined,
    };
  }
}
