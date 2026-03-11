"use server";

import { revalidatePath } from "next/cache";

import { saveReportDraft } from "@/features/drafts/save-report-draft";
import { saveNote } from "@/features/notes/save-note";

export async function saveNoteAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const body = String(formData.get("body") ?? "");

  if (!playerCaseId) {
    throw new Error("playerCaseId is required");
  }

  const note = await saveNote({
    playerCaseId,
    body,
  });

  if (caseSlug) {
    revalidatePath(`/cases/${caseSlug}`);
  }

  return note;
}

export async function saveReportDraftAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const suspectId = String(formData.get("suspectId") ?? "");
  const motiveId = String(formData.get("motiveId") ?? "");
  const methodId = String(formData.get("methodId") ?? "");

  if (!playerCaseId || !suspectId || !motiveId || !methodId) {
    throw new Error("Every draft field is required");
  }

  const draft = await saveReportDraft({
    playerCaseId,
    suspectId,
    motiveId,
    methodId,
  });

  if (caseSlug) {
    revalidatePath(`/cases/${caseSlug}`);
  }

  return draft;
}
