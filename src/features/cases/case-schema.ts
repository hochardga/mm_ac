import { z } from "zod";

import { evidenceIndexEntrySchema } from "@/features/cases/evidence/schema";

const objectiveOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
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

export const caseManifestSourceSchema = z
  .object({
    slug: z.string(),
    revision: z.string(),
    title: z.string(),
    summary: z.string(),
    complexity: z.enum(["light", "standard", "deep"]),
    evidence: z
      .array(evidenceIndexEntrySchema)
      .min(1)
      .refine(
        (entries) => new Set(entries.map((entry) => entry.id)).size === entries.length,
        {
          message: "evidence ids must be unique",
        },
      ),
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
  );

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

export const protectedCaseSchema = z.object({
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

export type CaseManifestSource = z.infer<typeof caseManifestSourceSchema>;
export type CaseManifest = z.infer<typeof caseManifestSchema>;
export type ProtectedCase = z.infer<typeof protectedCaseSchema>;
