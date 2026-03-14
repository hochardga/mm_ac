import type { notes, reportDrafts, reportSubmissions } from "@/db/schema";
import type { PlayerCaseStatus } from "@/features/cases/case-status";

type SavedNote = Pick<typeof notes.$inferSelect, "body" | "updatedAt"> | undefined;
type SavedDraft =
  | Pick<
      typeof reportDrafts.$inferSelect,
      "suspectId" | "motiveId" | "methodId" | "attemptCount" | "updatedAt"
    >
  | undefined;
type LatestSubmission =
  | Pick<typeof reportSubmissions.$inferSelect, "attemptNumber" | "nextStatus" | "feedback">
  | undefined;

export type CaseContinuitySection =
  | "evidence"
  | "notes"
  | "report"
  | "debrief";

export type CaseContinuitySummary = {
  section: CaseContinuitySection;
  label: string;
  description: string;
  href: string;
  lastActivityAt?: Date;
};

type BuildCaseContinuityInput = {
  caseSlug: string;
  status: PlayerCaseStatus;
  note: SavedNote;
  draft: SavedDraft;
  latestSubmission: LatestSubmission;
  playerCaseUpdatedAt: Date;
};

export function buildCaseContinuity(
  input: BuildCaseContinuityInput,
): CaseContinuitySummary {
  if (input.status === "completed") {
    return {
      section: "debrief",
      label: "Review Debrief",
      description: "Your solved case is ready for debrief review.",
      href: `/cases/${input.caseSlug}/debrief`,
      lastActivityAt: input.playerCaseUpdatedAt,
    };
  }

  if (input.status === "closed_unsolved") {
    return {
      section: "debrief",
      label: "Review Debrief",
      description: "Your closed case debrief is ready for review.",
      href: `/cases/${input.caseSlug}/debrief`,
      lastActivityAt: input.playerCaseUpdatedAt,
    };
  }

  if (input.draft) {
    const hasHandlerFeedback = input.latestSubmission?.nextStatus === "in_progress";
    const attemptLabel =
      input.draft.attemptCount > 0 ? `Attempt ${input.draft.attemptCount}.` : "";

    return {
      section: "report",
      label: "Resume Report",
      description: hasHandlerFeedback
        ? `Handler feedback is waiting on your report revision. ${attemptLabel}`.trim()
        : `Your draft report is saved and ready to continue. ${attemptLabel}`.trim(),
      href: `/cases/${input.caseSlug}#draft-report`,
      lastActivityAt: input.draft.updatedAt,
    };
  }

  if (input.note) {
    return {
      section: "notes",
      label: "Resume Notes",
      description: "Your field notes are saved and ready to revisit.",
      href: `/cases/${input.caseSlug}#field-notes`,
      lastActivityAt: input.note.updatedAt,
    };
  }

  return {
    section: "evidence",
    label: "Return to Evidence",
    description: "Reopen the dossier and continue reviewing evidence.",
    href: `/cases/${input.caseSlug}#evidence-intake`,
    lastActivityAt: input.playerCaseUpdatedAt,
  };
}

export function formatCaseContinuityTimestamp(
  date?: Date,
  locale = "en-US",
): string | null {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
