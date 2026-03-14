import type {
  notes,
  objectiveSubmissions,
  playerCaseObjectives,
  reportDrafts,
  reportSubmissions,
} from "@/db/schema";
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
type ObjectiveState = Pick<
  typeof playerCaseObjectives.$inferSelect,
  "objectiveId" | "stageId" | "status" | "draftPayload" | "updatedAt"
>;
type ObjectiveSubmission = Pick<
  typeof objectiveSubmissions.$inferSelect,
  "objectiveId" | "nextStatus" | "feedback" | "createdAt"
>;

export type CaseContinuitySection =
  | "evidence"
  | "notes"
  | "objectives"
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
  lastViewedEvidenceId?: string | null;
  lastViewedEvidenceAt?: Date | null;
  note: SavedNote;
  draft: SavedDraft;
  latestSubmission: LatestSubmission;
  objectiveStates?: ObjectiveState[];
  objectiveSubmissions?: ObjectiveSubmission[];
  playerCaseUpdatedAt: Date;
};

function buildCaseHref(
  caseSlug: string,
  anchor: string,
  lastViewedEvidenceId?: string | null,
) {
  const baseHref = lastViewedEvidenceId
    ? `/cases/${caseSlug}?evidence=${encodeURIComponent(lastViewedEvidenceId)}`
    : `/cases/${caseSlug}`;

  return `${baseHref}#${anchor}`;
}

function getLatestDate(...dates: Array<Date | null | undefined>) {
  return dates.reduce<Date | undefined>((latest, current) => {
    if (!current) {
      return latest;
    }

    if (!latest || current > latest) {
      return current;
    }

    return latest;
  }, undefined);
}

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

  const latestObjectiveDraft = [...(input.objectiveStates ?? [])]
    .filter(
      (objectiveState) =>
        objectiveState.status === "active" && objectiveState.draftPayload != null,
    )
    .sort(
      (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
    )[0];
  const latestObjectiveSubmission = [...(input.objectiveSubmissions ?? [])]
    .filter((submission) => submission.nextStatus === "in_progress")
    .sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    )[0];

  if (latestObjectiveDraft || latestObjectiveSubmission) {
    return {
      section: "objectives",
      label: "Resume Objectives",
      description: latestObjectiveSubmission
        ? "Objective feedback is waiting in your active objectives."
        : "Your active objective draft is saved and ready to continue.",
      href: buildCaseHref(
        input.caseSlug,
        "active-objectives",
        input.lastViewedEvidenceId,
      ),
      lastActivityAt: getLatestDate(
        latestObjectiveDraft?.updatedAt,
        latestObjectiveSubmission?.createdAt,
        input.lastViewedEvidenceAt,
        input.playerCaseUpdatedAt,
      ),
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
      href: buildCaseHref(
        input.caseSlug,
        "draft-report",
        input.lastViewedEvidenceId,
      ),
      lastActivityAt: getLatestDate(
        input.draft.updatedAt,
        input.lastViewedEvidenceAt,
        input.playerCaseUpdatedAt,
      ),
    };
  }

  if (input.note) {
    return {
      section: "notes",
      label: "Resume Notes",
      description: "Your field notes are saved and ready to revisit.",
      href: buildCaseHref(
        input.caseSlug,
        "field-notes",
        input.lastViewedEvidenceId,
      ),
      lastActivityAt: getLatestDate(
        input.note.updatedAt,
        input.lastViewedEvidenceAt,
        input.playerCaseUpdatedAt,
      ),
    };
  }

  return {
    section: "evidence",
    label: "Return to Evidence",
    description: "Reopen the dossier and continue reviewing evidence.",
    href: buildCaseHref(
      input.caseSlug,
      "evidence-intake",
      input.lastViewedEvidenceId,
    ),
    lastActivityAt: input.lastViewedEvidenceAt ?? input.playerCaseUpdatedAt,
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
