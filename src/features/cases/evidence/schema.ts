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
    family: z.enum([
      "document",
      "record",
      "thread",
      "photo",
      "audio",
      "diagram",
      "webpage",
    ]),
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
    timestamp: z.iso.datetime(),
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

const photoSubtypeSchema = z.enum([
  "scene_photo",
  "object_photo",
  "surveillance_still",
  "found_photo",
  "portrait_mugshot",
  "portrait_staff_directory",
  "portrait_social",
]);

export const photoEvidenceSourceSchema = z
  .object({
    subtype: photoSubtypeSchema,
    image: z.string().min(1),
    caption: z.string().min(1),
    sourceLabel: z.string().min(1),
    date: z.string().optional(),
  })
  .strict();

const audioSubtypeSchema = z.enum([
  "voicemail",
  "interview_audio",
  "dispatch_audio",
  "radio_call",
  "confession_audio",
]);

export const audioEvidenceSourceSchema = z
  .object({
    subtype: audioSubtypeSchema,
    audio: z.string().min(1),
    transcript: z.string().min(1),
    sourceLabel: z.string().min(1),
    date: z.string().optional(),
    durationSeconds: z.number().int().positive().optional(),
  })
  .strict();

const diagramSubtypeSchema = z.enum([
  "map",
  "floorplan",
  "site_diagram",
  "route_sketch",
]);

const diagramViewportSchema = z
  .object({
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .strict();

const diagramPointSchema = z.tuple([z.number(), z.number()]);

const diagramAreaElementSchema = z
  .object({
    id: z.string(),
    type: z.literal("area"),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    label: z.string().optional(),
  })
  .strict();

const diagramLineElementSchema = z
  .object({
    id: z.string(),
    type: z.literal("line"),
    points: z.array(diagramPointSchema).min(2),
  })
  .strict();

const diagramMarkerElementSchema = z
  .object({
    id: z.string(),
    type: z.literal("marker"),
    x: z.number(),
    y: z.number(),
    label: z.string(),
  })
  .strict();

const diagramLabelElementSchema = z
  .object({
    id: z.string(),
    type: z.literal("label"),
    x: z.number(),
    y: z.number(),
    text: z.string(),
  })
  .strict();

export const diagramElementSchema = z.discriminatedUnion("type", [
  diagramAreaElementSchema,
  diagramLineElementSchema,
  diagramMarkerElementSchema,
  diagramLabelElementSchema,
]);

export const diagramLegendEntrySchema = z
  .object({
    id: z.string(),
    label: z.string(),
  })
  .strict();

export const diagramEvidenceSourceSchema = z
  .object({
    subtype: diagramSubtypeSchema,
    viewport: diagramViewportSchema,
    elements: z.array(diagramElementSchema).min(1),
    legend: z.array(diagramLegendEntrySchema).optional(),
  })
  .strict();

const webpageSubtypeSchema = z.enum([
  "webpage",
  "portal_screen",
  "directory_listing",
  "classified_ad",
  "company_site",
  "harbor_schedule_site",
]);

const webpagePageSchema = z
  .object({
    title: z.string(),
    urlLabel: z.string().optional(),
    sourceLabel: z.string().optional(),
  })
  .strict();

const webpageCardItemSchema = z
  .object({
    title: z.string(),
    meta: z.string().optional(),
    body: z.string(),
  })
  .strict();

const webpageHeroBlockSchema = z
  .object({
    id: z.string(),
    type: z.literal("hero"),
    heading: z.string(),
    body: z.string(),
  })
  .strict();

const webpageNoticeBlockSchema = z
  .object({
    id: z.string(),
    type: z.literal("notice"),
    heading: z.string().optional(),
    body: z.string(),
  })
  .strict();

const webpageListBlockSchema = z
  .object({
    id: z.string(),
    type: z.literal("list"),
    heading: z.string().optional(),
    items: z.array(z.string()).min(1),
  })
  .strict();

const webpageTableBlockSchema = z
  .object({
    id: z.string(),
    type: z.literal("table"),
    columns: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
  })
  .strict();

const webpagePostsBlockSchema = z
  .object({
    id: z.string(),
    type: z.literal("posts"),
    items: z.array(webpageCardItemSchema).min(1),
  })
  .strict();

const webpageDirectoryBlockSchema = z
  .object({
    id: z.string(),
    type: z.literal("directory"),
    items: z.array(webpageCardItemSchema).min(1),
  })
  .strict();

export const webpageBlockSchema = z.discriminatedUnion("type", [
  webpageHeroBlockSchema,
  webpageNoticeBlockSchema,
  webpageListBlockSchema,
  webpageTableBlockSchema,
  webpagePostsBlockSchema,
  webpageDirectoryBlockSchema,
]);

export const webpageEvidenceSourceSchema = z
  .object({
    subtype: webpageSubtypeSchema,
    page: webpagePageSchema,
    blocks: z.array(webpageBlockSchema).min(1),
  })
  .strict();

const normalizedEvidenceBaseSchema = evidenceIndexEntrySchema;

export const documentEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("document"),
    body: z.string().min(1),
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

export const photoEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("photo"),
    image: z.string().min(1),
    caption: z.string().min(1),
    sourceLabel: z.string().min(1),
    date: z.string().optional(),
  })
  .strict();

export const audioEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("audio"),
    audio: z.string().min(1),
    transcript: z.string().min(1),
    sourceLabel: z.string().min(1),
    date: z.string().optional(),
    durationSeconds: z.number().int().positive().optional(),
  })
  .strict();

export const diagramEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("diagram"),
    viewport: diagramViewportSchema,
    elements: z.array(diagramElementSchema).min(1),
    legend: z.array(diagramLegendEntrySchema).optional(),
  })
  .strict();

export const webpageEvidenceSchema = normalizedEvidenceBaseSchema
  .extend({
    family: z.literal("webpage"),
    page: webpagePageSchema,
    blocks: z.array(webpageBlockSchema).min(1),
  })
  .strict();

export const caseEvidenceSchema = z.discriminatedUnion("family", [
  documentEvidenceSchema,
  recordEvidenceSchema,
  threadEvidenceSchema,
  photoEvidenceSchema,
  audioEvidenceSchema,
  diagramEvidenceSchema,
  webpageEvidenceSchema,
]);

export type EvidenceIndexEntry = z.infer<typeof evidenceIndexEntrySchema>;
export type DocumentEvidenceSource = z.infer<typeof documentEvidenceSourceSchema>;
export type RecordEvidenceSource = z.infer<typeof recordEvidenceSourceSchema>;
export type ThreadEvidenceSource = z.infer<typeof threadEvidenceSourceSchema>;
export type PhotoEvidenceSource = z.infer<typeof photoEvidenceSourceSchema>;
export type AudioEvidenceSource = z.infer<typeof audioEvidenceSourceSchema>;
export type DiagramElement = z.infer<typeof diagramElementSchema>;
export type DiagramLegendEntry = z.infer<typeof diagramLegendEntrySchema>;
export type DiagramEvidenceSource = z.infer<typeof diagramEvidenceSourceSchema>;
export type WebpageBlock = z.infer<typeof webpageBlockSchema>;
export type WebpageEvidenceSource = z.infer<typeof webpageEvidenceSourceSchema>;
export type DocumentEvidence = z.infer<typeof documentEvidenceSchema>;
export type RecordEvidence = z.infer<typeof recordEvidenceSchema>;
export type ThreadEvidence = z.infer<typeof threadEvidenceSchema>;
export type PhotoEvidence = z.infer<typeof photoEvidenceSchema>;
export type AudioEvidence = z.infer<typeof audioEvidenceSchema>;
export type DiagramEvidence = z.infer<typeof diagramEvidenceSchema>;
export type WebpageEvidence = z.infer<typeof webpageEvidenceSchema>;
export type CaseEvidence = z.infer<typeof caseEvidenceSchema>;
