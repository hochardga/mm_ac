import type { StagedProtectedCase } from "@/features/cases/case-schema";
import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";

export function formatStagedAnswer(
  objective: LoadedStagedCaseManifest["stages"][number]["objectives"][number],
  payload:
    | ObjectiveAnswerPayload
    | StagedProtectedCase["canonicalAnswers"][string],
) {
  switch (objective.type) {
    case "single_choice":
      if (payload.type !== "single_choice") {
        throw new Error(
          `Objective ${objective.id} expected single_choice payload but received ${payload.type}`,
        );
      }

      return (
        objective.options.find((option) => option.id === payload.choiceId)?.label ??
        payload.choiceId
      );
    case "multi_choice":
      if (payload.type !== "multi_choice") {
        throw new Error(
          `Objective ${objective.id} expected multi_choice payload but received ${payload.type}`,
        );
      }

      return payload.choiceIds
        .map(
          (choiceId) =>
            objective.options.find((option) => option.id === choiceId)?.label ??
            choiceId,
        )
        .join(", ");
    case "boolean":
      if (payload.type !== "boolean") {
        throw new Error(
          `Objective ${objective.id} expected boolean payload but received ${payload.type}`,
        );
      }

      return payload.value ? "Yes" : "No";
    case "code_entry":
      if (payload.type !== "code_entry") {
        throw new Error(
          `Objective ${objective.id} expected code_entry payload but received ${payload.type}`,
        );
      }

      return payload.value;
  }
}
