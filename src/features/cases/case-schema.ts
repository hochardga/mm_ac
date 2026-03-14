import { z } from "zod";

import { evidenceIndexEntrySchema } from "@/features/cases/evidence/schema";

const objectiveOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const evidenceListSchema = z
  .array(evidenceIndexEntrySchema)
  .min(1)
  .refine(
    (entries) => new Set(entries.map((entry) => entry.id)).size === entries.length,
    {
      message: "evidence ids must be unique",
    },
  );

const legacyReportOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const legacyCaseManifestSourceSchema = z.object({
  slug: z.string(),
  revision: z.string(),
  title: z.string(),
  summary: z.string(),
  estimatedMinutes: z.number().int().positive(),
  reportOptions: z.object({
    suspect: z.array(legacyReportOptionSchema).min(1),
    motive: z.array(legacyReportOptionSchema).min(1),
    method: z.array(legacyReportOptionSchema).min(1),
  }),
  handlerPrompts: z.array(z.string()),
  evidence: evidenceListSchema,
});

const objectiveBaseSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  stakes: z.enum(["advisory", "graded"]),
  successUnlocks: z.object({
    stageIds: z.array(z.string()).default([]),
    resolvesCase: z.boolean().default(false),
  }),
});

const objectiveSchema = z.discriminatedUnion("type", [
  objectiveBaseSchema
    .extend({
      type: z.literal("single_choice"),
      options: z.array(objectiveOptionSchema).min(1),
    })
    .strict(),
  objectiveBaseSchema
    .extend({
      type: z.literal("multi_choice"),
      options: z.array(objectiveOptionSchema).min(2),
    })
    .strict(),
  objectiveBaseSchema
    .extend({
      type: z.literal("boolean"),
    })
    .strict(),
  objectiveBaseSchema
    .extend({
      type: z.literal("code_entry"),
    })
    .strict(),
]);

const stageSchema = z.object({
  id: z.string(),
  startsUnlocked: z.boolean(),
  title: z.string(),
  summary: z.string(),
  handlerPrompts: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  objectives: z.array(objectiveSchema).min(1),
});

export const stagedCaseManifestSourceSchema = z
  .object({
    slug: z.string(),
    revision: z.string(),
    title: z.string(),
    summary: z.string(),
    complexity: z.enum(["light", "standard", "deep"]),
    evidence: evidenceListSchema,
    stages: z.array(stageSchema).min(1),
  })
  .refine(
    (manifest) =>
      new Set(manifest.stages.map((stage) => stage.id)).size ===
      manifest.stages.length,
    {
      message: "stage ids must be unique",
      path: ["stages"],
    },
  )
  .refine(
    (manifest) => {
      const objectiveIds = manifest.stages.flatMap((stage) =>
        stage.objectives.map((objective) => objective.id),
      );
      return new Set(objectiveIds).size === objectiveIds.length;
    },
    {
      message: "objective ids must be unique",
      path: ["stages"],
    },
  )
  .refine(
    (manifest) => {
      const evidenceIds = new Set(manifest.evidence.map((entry) => entry.id));
      return manifest.stages.every((stage) =>
        stage.evidenceIds.every((id) => evidenceIds.has(id)),
      );
    },
    {
      message: "stage evidence ids must reference evidence entries",
      path: ["stages"],
    },
  )
  .refine(
    (manifest) => {
      const stageIds = new Set(manifest.stages.map((stage) => stage.id));
      return manifest.stages.every((stage) =>
        stage.objectives.every((objective) =>
          objective.successUnlocks.stageIds.every((id) => stageIds.has(id)),
        ),
      );
    },
    {
      message: "success unlock stage ids must reference stages",
      path: ["stages"],
    },
  );

export const caseManifestSourceSchema = z.union([
  legacyCaseManifestSourceSchema,
  stagedCaseManifestSourceSchema,
]);

export const caseManifestSchema = caseManifestSourceSchema;

const objectiveAnswerSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("single_choice"),
      choiceId: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal("multi_choice"),
      choiceIds: z.array(z.string()).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("boolean"),
      value: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("code_entry"),
      value: z.string(),
    })
    .strict(),
]);

export const legacyProtectedCaseSchema = z.object({
  slug: z.string(),
  revision: z.string(),
  canonicalAnswers: z.object({
    suspect: z.string(),
    motive: z.string(),
    method: z.string(),
  }),
  grading: z.object({
    maxAttempts: z.number().int().positive(),
  }),
  feedbackTemplates: z.object({
    incorrect_attempt_remaining: z.string(),
    final_incorrect_closure: z.string(),
    solved: z.string(),
  }),
  debriefs: z.object({
    solved: z.object({
      title: z.string(),
      summary: z.string(),
    }),
    closed_unsolved: z.object({
      title: z.string(),
      summary: z.string(),
    }),
  }),
});

export const stagedProtectedCaseSchema = z.object({
  slug: z.string(),
  revision: z.string(),
  grading: z.object({
    maxGradedFailures: z.number().int().positive(),
  }),
  canonicalAnswers: z.record(z.string(), objectiveAnswerSchema),
  debriefs: z.object({
    solved: z.object({
      title: z.string(),
      summary: z.string(),
    }),
    closed_unsolved: z.object({
      title: z.string(),
      summary: z.string(),
    }),
  }),
});

export const protectedCaseSchema = z.union([
  legacyProtectedCaseSchema,
  stagedProtectedCaseSchema,
]);

export type LegacyCaseManifestSource = z.infer<
  typeof legacyCaseManifestSourceSchema
>;
export type StagedCaseManifestSource = z.infer<
  typeof stagedCaseManifestSourceSchema
>;
export type CaseManifestSource = z.infer<typeof caseManifestSourceSchema>;
export type LegacyCaseManifest = z.infer<typeof legacyCaseManifestSourceSchema>;
export type StagedCaseManifest = z.infer<typeof stagedCaseManifestSourceSchema>;
export type CaseManifest = z.infer<typeof caseManifestSchema>;
export type LegacyProtectedCase = z.infer<typeof legacyProtectedCaseSchema>;
export type StagedProtectedCase = z.infer<typeof stagedProtectedCaseSchema>;
export type ProtectedCase = z.infer<typeof protectedCaseSchema>;
