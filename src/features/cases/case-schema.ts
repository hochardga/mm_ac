import { z } from "zod";

import { evidenceIndexEntrySchema } from "@/features/cases/evidence/schema";

const reportOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const caseManifestSourceSchema = z.object({
  slug: z.string(),
  revision: z.string(),
  title: z.string(),
  summary: z.string(),
  estimatedMinutes: z.number().int().positive(),
  reportOptions: z.object({
    suspect: z.array(reportOptionSchema).min(1),
    motive: z.array(reportOptionSchema).min(1),
    method: z.array(reportOptionSchema).min(1),
  }),
  handlerPrompts: z.array(z.string()),
  evidence: z
    .array(evidenceIndexEntrySchema)
    .min(1)
    .refine(
      (entries) => new Set(entries.map((entry) => entry.id)).size === entries.length,
      {
        message: "evidence ids must be unique",
      },
    ),
});

export const caseManifestSchema = caseManifestSourceSchema;

export const protectedCaseSchema = z.object({
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

export type CaseManifestSource = z.infer<typeof caseManifestSourceSchema>;
export type CaseManifest = z.infer<typeof caseManifestSchema>;
export type ProtectedCase = z.infer<typeof protectedCaseSchema>;
