import "server-only";

import { loadProtectedCase } from "@/features/cases/load-protected-case";

type EvaluateReportInput = {
  answers: {
    suspectId: string;
    motiveId: string;
    methodId: string;
  };
  attemptNumber: number;
  protectedCaseSlug: string;
};

export async function evaluateReport(input: EvaluateReportInput) {
  const protectedCase = await loadProtectedCase(input.protectedCaseSlug);
  const isCorrect =
    input.answers.suspectId === protectedCase.canonicalAnswers.suspect &&
    input.answers.motiveId === protectedCase.canonicalAnswers.motive &&
    input.answers.methodId === protectedCase.canonicalAnswers.method;

  if (isCorrect) {
    return {
      nextStatus: "completed" as const,
      terminal: true,
      feedback: protectedCase.feedbackTemplates.solved,
      debrief: protectedCase.debriefs.solved,
    };
  }

  if (input.attemptNumber >= protectedCase.grading.maxAttempts) {
    return {
      nextStatus: "closed_unsolved" as const,
      terminal: true,
      feedback: protectedCase.feedbackTemplates.final_incorrect_closure,
      debrief: protectedCase.debriefs.closed_unsolved,
    };
  }

  return {
    nextStatus: "in_progress" as const,
    terminal: false,
    feedback: protectedCase.feedbackTemplates.incorrect_attempt_remaining,
    debrief: null,
  };
}
