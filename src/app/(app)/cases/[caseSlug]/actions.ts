"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveReportDraft } from "@/features/drafts/save-report-draft";
import { saveNote } from "@/features/notes/save-note";
import { submitReport } from "@/features/submissions/submit-report";

export async function saveNoteAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const body = String(formData.get("body") ?? "");

  if (!playerCaseId) {
    throw new Error("playerCaseId is required");
  }

  await saveNote({
    playerCaseId,
    body,
  });

  if (caseSlug) {
    revalidatePath(`/cases/${caseSlug}`);
  }
}

export async function saveReportDraftAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const selectedEvidenceId = String(formData.get("selectedEvidenceId") ?? "");
  const suspectId = String(formData.get("suspectId") ?? "");
  const motiveId = String(formData.get("motiveId") ?? "");
  const methodId = String(formData.get("methodId") ?? "");

  if (!playerCaseId || !suspectId || !motiveId || !methodId) {
    throw new Error("Every draft field is required");
  }

  await saveReportDraft({
    playerCaseId,
    suspectId,
    motiveId,
    methodId,
  });

  if (caseSlug) {
    if (selectedEvidenceId) {
      redirect(
        `/cases/${caseSlug}?evidence=${encodeURIComponent(selectedEvidenceId)}`,
      );
    }

    redirect(`/cases/${caseSlug}`);
  }
}

export async function submitReportAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const submissionToken = String(formData.get("submissionToken") ?? "");
  const suspectId = String(formData.get("suspectId") ?? "");
  const motiveId = String(formData.get("motiveId") ?? "");
  const methodId = String(formData.get("methodId") ?? "");

  if (!caseSlug || !playerCaseId || !submissionToken) {
    throw new Error("Submission context is incomplete");
  }

  if (!suspectId || !motiveId || !methodId) {
    throw new Error("Every report field is required");
  }

  const result = await submitReport({
    playerCaseId,
    submissionToken,
    answers: {
      suspectId,
      motiveId,
      methodId,
    },
  });

  if (result.nextStatus === "completed" || result.nextStatus === "closed_unsolved") {
    redirect(`/cases/${caseSlug}/debrief`);
  }

  revalidatePath(`/cases/${caseSlug}`);
}
