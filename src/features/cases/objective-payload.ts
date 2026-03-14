export type ObjectiveAnswerPayload =
  | { type: "single_choice"; choiceId: string }
  | { type: "multi_choice"; choiceIds: string[] }
  | { type: "boolean"; value: boolean }
  | { type: "code_entry"; value: string };

function requireString(
  formData: FormData,
  key: string,
  message: string,
): string {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(message);
  }

  return value;
}

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  throw new Error("Boolean objective values must be true or false");
}

export function normalizeObjectivePayload(
  objectiveType: string,
  formData: FormData,
): ObjectiveAnswerPayload {
  switch (objectiveType) {
    case "single_choice": {
      return {
        type: "single_choice",
        choiceId: requireString(
          formData,
          "choiceId",
          "single_choice objective requires choiceId",
        ),
      };
    }
    case "multi_choice": {
      const choiceIds = Array.from(
        new Set(
          formData
            .getAll("choiceIds")
            .map((value) => String(value).trim())
            .filter((value) => value.length > 0),
        ),
      );

      if (choiceIds.length === 0) {
        throw new Error("multi_choice objective requires at least one choice");
      }

      return {
        type: "multi_choice",
        choiceIds,
      };
    }
    case "boolean": {
      return {
        type: "boolean",
        value: parseBoolean(
          requireString(formData, "value", "boolean objective requires value"),
        ),
      };
    }
    case "code_entry": {
      return {
        type: "code_entry",
        value: requireString(
          formData,
          "value",
          "code_entry objective requires value",
        ),
      };
    }
    default: {
      throw new Error(`Unsupported objective type: ${objectiveType}`);
    }
  }
}
