"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { playerCases } from "@/db/schema";
import { getCurrentAgentId } from "@/features/auth/current-agent";
import { toggleEvidenceBookmark } from "@/features/cases/evidence-bookmarks";
import { loadAnyCaseManifest } from "@/features/cases/load-case-manifest";
import { normalizeObjectivePayload } from "@/features/cases/objective-payload";
import { saveObjectiveDraft } from "@/features/drafts/save-objective-draft";
import { saveReportDraft } from "@/features/drafts/save-report-draft";
import { saveNote } from "@/features/notes/save-note";
import { submitObjective } from "@/features/submissions/submit-objective";
import { submitReport } from "@/features/submissions/submit-report";
import { getDb } from "@/lib/db";

async function requireOwnedPlayerCase(playerCaseId: string) {
  const agentId = await getCurrentAgentId();

  if (!agentId) {
    throw new Error("Agent is not authenticated");
  }

  const db = await getDb();
  const playerCase = await db.query.playerCases.findFirst({
    where: eq(playerCases.id, playerCaseId),
  });

  if (!playerCase) {
    throw new Error("Player case not found");
  }

  if (playerCase.userId !== agentId) {
    throw new Error("Not authorized to access this player case");
  }

  return playerCase;
}

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

export async function toggleEvidenceBookmarkAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const evidenceId = String(formData.get("evidenceId") ?? "");
  const selectedEvidenceId = String(formData.get("selectedEvidenceId") ?? "");

  if (!caseSlug || !playerCaseId || !evidenceId) {
    throw new Error("Bookmark context is incomplete");
  }

  const playerCase = await requireOwnedPlayerCase(playerCaseId);
  const manifest = await loadAnyCaseManifest(caseSlug, {
    expectedRevision: playerCase.caseRevision,
  });
  const evidenceExists = manifest.evidence.some((evidence) => evidence.id === evidenceId);

  if (!evidenceExists) {
    throw new Error("Evidence could not be found");
  }

  await toggleEvidenceBookmark({
    playerCaseId,
    evidenceId,
  });

  if (selectedEvidenceId) {
    redirect(`/cases/${caseSlug}?evidence=${encodeURIComponent(selectedEvidenceId)}`);
  }

  redirect(`/cases/${caseSlug}`);
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

export async function saveObjectiveDraftAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const objectiveId = String(formData.get("objectiveId") ?? "");
  const objectiveType = String(formData.get("objectiveType") ?? "");
  const selectedEvidenceId = String(formData.get("selectedEvidenceId") ?? "");

  if (!playerCaseId || !objectiveId || !objectiveType) {
    throw new Error("Objective draft context is incomplete");
  }

  await requireOwnedPlayerCase(playerCaseId);
  const payload = normalizeObjectivePayload(objectiveType, formData);

  await saveObjectiveDraft({
    playerCaseId,
    objectiveId,
    payload,
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
  const selectedEvidenceId = String(formData.get("selectedEvidenceId") ?? "");
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

  if (selectedEvidenceId) {
    redirect(`/cases/${caseSlug}?evidence=${encodeURIComponent(selectedEvidenceId)}`);
  }

  redirect(`/cases/${caseSlug}`);
}

export async function submitObjectiveAction(formData: FormData) {
  const caseSlug = String(formData.get("caseSlug") ?? "");
  const playerCaseId = String(formData.get("playerCaseId") ?? "");
  const objectiveId = String(formData.get("objectiveId") ?? "");
  const objectiveType = String(formData.get("objectiveType") ?? "");
  const submissionToken = String(formData.get("submissionToken") ?? "");
  const selectedEvidenceId = String(formData.get("selectedEvidenceId") ?? "");

  if (
    !caseSlug ||
    !playerCaseId ||
    !objectiveId ||
    !objectiveType ||
    !submissionToken
  ) {
    throw new Error("Objective submission context is incomplete");
  }

  await requireOwnedPlayerCase(playerCaseId);
  const payload = normalizeObjectivePayload(objectiveType, formData);
  const result = await submitObjective({
    playerCaseId,
    objectiveId,
    submissionToken,
    payload,
  });

  if (result.nextStatus === "completed" || result.nextStatus === "closed_unsolved") {
    redirect(`/cases/${caseSlug}/debrief`);
  }

  if (selectedEvidenceId) {
    redirect(`/cases/${caseSlug}?evidence=${encodeURIComponent(selectedEvidenceId)}`);
  }

  redirect(`/cases/${caseSlug}`);
}
