import type { objectiveSubmissions, playerCaseObjectives } from "@/db/schema";
import {
  saveObjectiveDraftAction,
  submitObjectiveAction,
} from "@/app/(app)/cases/[caseSlug]/actions";
import { ObjectiveFormFields } from "@/features/cases/components/objective-form-fields";
import type { ObjectiveReviewState } from "@/features/cases/objective-review-state";
import { ReportActionButton } from "@/features/cases/components/report-action-button";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";

type ObjectiveRow = typeof playerCaseObjectives.$inferSelect;
type ObjectiveSubmissionRow = typeof objectiveSubmissions.$inferSelect;
type ProgressObjective = LoadedStagedCaseManifest["stages"][number]["objectives"][number] & {
  stageId: string;
};

type ActiveObjectivesPanelProps = {
  caseSlug: string;
  playerCaseId: string;
  selectedEvidenceId?: string;
  activeObjectives: ProgressObjective[];
  solvedObjectives: ProgressObjective[];
  objectiveRows: ObjectiveRow[];
  objectiveSubmissions: ObjectiveSubmissionRow[];
  reviewState?: ObjectiveReviewState;
  submissionToken: string;
};

function getDraftPayload(
  objectiveRow: ObjectiveRow | undefined,
): ObjectiveAnswerPayload | null {
  return (objectiveRow?.draftPayload as ObjectiveAnswerPayload | null | undefined) ?? null;
}

function buildLatestSubmissionByObjective(
  objectiveSubmissionRows: ObjectiveSubmissionRow[],
) {
  const latestSubmissionByObjective = new Map<string, ObjectiveSubmissionRow>();

  for (const submission of objectiveSubmissionRows) {
    if (!latestSubmissionByObjective.has(submission.objectiveId)) {
      latestSubmissionByObjective.set(submission.objectiveId, submission);
    }
  }

  return latestSubmissionByObjective;
}

export function ActiveObjectivesPanel({
  caseSlug,
  playerCaseId,
  selectedEvidenceId,
  activeObjectives,
  solvedObjectives,
  objectiveRows,
  objectiveSubmissions,
  reviewState,
  submissionToken,
}: ActiveObjectivesPanelProps) {
  const objectiveRowById = new Map(
    objectiveRows.map((objectiveRow) => [objectiveRow.objectiveId, objectiveRow]),
  );
  const latestSubmissionByObjective =
    buildLatestSubmissionByObjective(objectiveSubmissions);

  return (
    <div className="space-y-6">
      <section
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
        id="active-objectives"
      >
        <h2 className="text-2xl font-semibold">Active Objectives</h2>
        {reviewState ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#d96c3d]/40 bg-[#d96c3d]/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#f0b48f]">
              Failure Pressure
            </p>
            <h3 className="mt-3 text-xl font-semibold text-stone-50">
              {reviewState.failureBudget.summaryLabel}
            </h3>
            <p className="mt-2 text-sm leading-7 text-stone-100">
              {reviewState.failureBudget.spent} of {reviewState.failureBudget.max}{" "}
              graded failures spent
            </p>
            {reviewState.latestGradedFeedback ? (
              <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#f0b48f]">
                  Latest Graded Feedback
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-100">
                  {reviewState.latestGradedFeedback.feedback}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 space-y-5">
          {activeObjectives.length === 0 ? (
            <p className="text-sm leading-7 text-stone-300">
              No active objectives are waiting right now.
            </p>
          ) : (
            activeObjectives.map((objective) => {
              const objectiveRow = objectiveRowById.get(objective.id);
              const latestSubmission = latestSubmissionByObjective.get(objective.id);
              const attemptHistory = reviewState?.attemptsByObjective.get(objective.id) ?? [];

              return (
                <article
                  key={objective.id}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[#f0b48f]">
                    Stage / {objective.stageId}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{objective.prompt}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300">
                    Stakes: {objective.stakes === "graded" ? "Graded" : "Advisory"}
                  </p>
                  {latestSubmission ? (
                    <div className="mt-4 rounded-[1.25rem] border border-[#d96c3d]/40 bg-[#d96c3d]/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#f0b48f]">
                        Latest Feedback / Attempt {latestSubmission.attemptNumber}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-stone-100">
                        {latestSubmission.feedback}
                      </p>
                    </div>
                  ) : null}
                  {attemptHistory.length > 0 ? (
                    <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                        Attempt Ledger
                      </p>
                      <div className="mt-3 space-y-3">
                        {attemptHistory.map((attempt) => (
                          <article
                            key={`${objective.id}-attempt-${attempt.attemptNumber}`}
                            className="rounded-[1rem] border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-stone-400">
                              <span>Attempt {attempt.attemptNumber}</span>
                              <span>{attempt.statusLabel}</span>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-stone-100">
                              Filed answer: {attempt.answerLabel}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-stone-300">
                              {attempt.feedback}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <form action={saveObjectiveDraftAction} className="mt-5 grid gap-4">
                    <input name="caseSlug" type="hidden" value={caseSlug} />
                    <input name="playerCaseId" type="hidden" value={playerCaseId} />
                    <input name="objectiveId" type="hidden" value={objective.id} />
                    <input name="objectiveType" type="hidden" value={objective.type} />
                    <input
                      name="selectedEvidenceId"
                      type="hidden"
                      value={selectedEvidenceId ?? ""}
                    />
                    <input
                      name="submissionToken"
                      type="hidden"
                      value={`${submissionToken}:${objective.id}`}
                    />
                    <ObjectiveFormFields
                      draftPayload={getDraftPayload(objectiveRow)}
                      objective={objective}
                    />
                    <div className="flex flex-wrap gap-3">
                      <ReportActionButton
                        className="w-fit rounded-full bg-[#d96c3d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-950"
                        idleLabel="Save Draft"
                        pendingLabel="Saving Draft..."
                      />
                      <ReportActionButton
                        className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
                        formAction={submitObjectiveAction}
                        idleLabel="Submit Objective"
                        pendingLabel="Submitting Objective..."
                      />
                    </div>
                  </form>
                </article>
              );
            })
          )}
        </div>
      </section>

      {solvedObjectives.length > 0 ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Completed Objectives</h2>
          <div className="mt-6 space-y-4">
            {solvedObjectives.map((objective) => {
              const latestSubmission = latestSubmissionByObjective.get(objective.id);
              const latestAttempt = reviewState?.attemptsByObjective.get(objective.id)?.at(-1);

              return (
                <article
                  key={objective.id}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    Solved / {objective.stageId}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{objective.prompt}</h3>
                  {latestAttempt ? (
                    <div className="mt-3 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Solved on Attempt {latestAttempt.attemptNumber}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-stone-100">
                        Filed answer: {latestAttempt.answerLabel}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-stone-300">
                        {latestAttempt.statusLabel}. {latestAttempt.feedback}
                      </p>
                    </div>
                  ) : latestSubmission ? (
                    <p className="mt-3 text-sm leading-7 text-stone-100">
                      {latestSubmission.feedback}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
