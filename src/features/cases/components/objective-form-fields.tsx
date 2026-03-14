import type { LoadedStagedCaseManifest } from "@/features/cases/load-case-manifest";
import type { ObjectiveAnswerPayload } from "@/features/cases/objective-payload";

type StagedObjective = LoadedStagedCaseManifest["stages"][number]["objectives"][number];

type ObjectiveFormFieldsProps = {
  objective: StagedObjective;
  draftPayload?: ObjectiveAnswerPayload | null;
};

export function ObjectiveFormFields({
  objective,
  draftPayload,
}: ObjectiveFormFieldsProps) {
  switch (objective.type) {
    case "single_choice":
      return (
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
            Response
          </span>
          <select
            className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
            defaultValue={
              draftPayload?.type === "single_choice" ? draftPayload.choiceId : ""
            }
            name="choiceId"
            required
          >
            <option value="">Select response</option>
            {objective.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "multi_choice": {
      const selectedChoiceIds =
        draftPayload?.type === "multi_choice"
          ? new Set(draftPayload.choiceIds)
          : new Set<string>();

      return (
        <fieldset className="grid gap-3">
          <legend className="text-sm uppercase tracking-[0.2em] text-stone-400">
            Responses
          </legend>
          {objective.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
            >
              <input
                defaultChecked={selectedChoiceIds.has(option.id)}
                name="choiceIds"
                type="checkbox"
                value={option.id}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      );
    }
    case "boolean":
      return (
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
            Response
          </span>
          <select
            className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
            defaultValue={
              draftPayload?.type === "boolean"
                ? String(draftPayload.value)
                : ""
            }
            name="value"
            required
          >
            <option value="">Select response</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      );
    case "code_entry":
      return (
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.2em] text-stone-400">
            Code Entry
          </span>
          <input
            className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100"
            defaultValue={
              draftPayload?.type === "code_entry" ? draftPayload.value : ""
            }
            name="value"
            placeholder="Enter code"
            required
            type="text"
          />
        </label>
      );
  }
}
