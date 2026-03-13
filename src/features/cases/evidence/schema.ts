import { z } from "zod";

const evidenceViewerSchema = z
  .object({
    density: z.enum(["comfortable", "compact"]).optional(),
    newestFirst: z.boolean().optional(),
    defaultExpanded: z.boolean().optional(),
  })
  .strict();

export const evidenceIndexEntrySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    family: z.enum(["document", "record", "thread"]),
    subtype: z.string(),
    summary: z.string(),
    source: z.string().min(1),
    viewer: evidenceViewerSchema.optional(),
  })
  .strict();

const evidenceMetaValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const documentEvidenceSourceSchema = z
  .object({
    subtype: z.string(),
    body: z.string().min(1),
    meta: z.record(z.string(), evidenceMetaValueSchema).default({}),
  })
  .strict();

export const recordEvidenceColumnSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
  })
  .strict();

export const recordEvidenceRowSchema = z
  .object({
    id: z.string(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]));

export const recordEvidenceSourceSchema = z
  .object({
    subtype: z.string(),
    columns: z.array(recordEvidenceColumnSchema),
    rows: z.array(recordEvidenceRowSchema),
  })
  .strict();

export const threadMetadataSchema = z
  .object({
    subject: z.string(),
    channel: z.string().optional(),
    participants: z.array(z.string()).optional(),
  })
  .strict();

export const threadMessageSchema = z
  .object({
    id: z.string(),
    sender: z.string(),
    timestamp: z.string(),
    body: z.string(),
  })
  .strict();

export const threadEvidenceSourceSchema = z
  .object({
    subtype: z.string(),
    thread: threadMetadataSchema,
    messages: z.array(threadMessageSchema),
  })
  .strict();

const normalizedEvidenceBaseSchema = evidenceIndexEntrySchema.extend({
  viewer: evidenceViewerSchema.optional(),
});

export const documentEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("document"),
    body: z.string(),
    meta: z.record(z.string(), evidenceMetaValueSchema),
  })
  .strict();

export const recordEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("record"),
    columns: z.array(recordEvidenceColumnSchema),
    rows: z.array(recordEvidenceRowSchema),
  })
  .strict();

export const threadEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("thread"),
    thread: threadMetadataSchema,
    messages: z.array(threadMessageSchema),
  })
  .strict();

export const caseEvidenceSchema = z.discriminatedUnion("family", [
  documentEvidenceSchema,
  recordEvidenceSchema,
  threadEvidenceSchema,
]);

export type EvidenceIndexEntry = z.infer<typeof evidenceIndexEntrySchema>;
export type DocumentEvidenceSource = z.infer<typeof documentEvidenceSourceSchema>;
export type RecordEvidenceSource = z.infer<typeof recordEvidenceSourceSchema>;
export type ThreadEvidenceSource = z.infer<typeof threadEvidenceSourceSchema>;
export type DocumentEvidence = z.infer<typeof documentEvidenceSchema>;
export type RecordEvidence = z.infer<typeof recordEvidenceSchema>;
export type ThreadEvidence = z.infer<typeof threadEvidenceSchema>;
export type CaseEvidence = z.infer<typeof caseEvidenceSchema>;
