import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  alias: text("alias").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const caseDefinitions = pgTable("case_definitions", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  currentPublishedRevision: text("current_published_revision").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerCases = pgTable("player_cases", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  caseDefinitionId: text("case_definition_id")
    .notNull()
    .references(() => caseDefinitions.id, { onDelete: "cascade" }),
  caseRevision: text("case_revision").notNull(),
  status: text("status").notNull(),
  terminalDebriefTitle: text("terminal_debrief_title"),
  terminalDebriefSummary: text("terminal_debrief_summary"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  playerCaseId: text("player_case_id")
    .notNull()
    .references(() => playerCases.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportDrafts = pgTable("report_drafts", {
  id: text("id").primaryKey(),
  playerCaseId: text("player_case_id")
    .notNull()
    .unique()
    .references(() => playerCases.id, { onDelete: "cascade" }),
  suspectId: text("suspect_id").notNull(),
  motiveId: text("motive_id").notNull(),
  methodId: text("method_id").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportSubmissions = pgTable("report_submissions", {
  id: text("id").primaryKey(),
  playerCaseId: text("player_case_id")
    .notNull()
    .references(() => playerCases.id, { onDelete: "cascade" }),
  submissionToken: text("submission_token").notNull().unique(),
  suspectId: text("suspect_id").notNull(),
  motiveId: text("motive_id").notNull(),
  methodId: text("method_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  nextStatus: text("next_status").notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  playerId: text("player_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  caseDefinitionId: text("case_definition_id").references(() => caseDefinitions.id, {
    onDelete: "cascade",
  }),
  caseRevision: text("case_revision"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  playerCases: many(playerCases),
  analyticsEvents: many(analyticsEvents),
}));

export const caseDefinitionsRelations = relations(caseDefinitions, ({ many }) => ({
  playerCases: many(playerCases),
  analyticsEvents: many(analyticsEvents),
}));

export const playerCasesRelations = relations(playerCases, ({ one, many }) => ({
  user: one(users, {
    fields: [playerCases.userId],
    references: [users.id],
  }),
  caseDefinition: one(caseDefinitions, {
    fields: [playerCases.caseDefinitionId],
    references: [caseDefinitions.id],
  }),
  notes: many(notes),
  reportDrafts: many(reportDrafts),
  reportSubmissions: many(reportSubmissions),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  playerCase: one(playerCases, {
    fields: [notes.playerCaseId],
    references: [playerCases.id],
  }),
}));

export const reportDraftsRelations = relations(reportDrafts, ({ one }) => ({
  playerCase: one(playerCases, {
    fields: [reportDrafts.playerCaseId],
    references: [playerCases.id],
  }),
}));

export const reportSubmissionsRelations = relations(
  reportSubmissions,
  ({ one }) => ({
    playerCase: one(playerCases, {
      fields: [reportSubmissions.playerCaseId],
      references: [playerCases.id],
    }),
  }),
);

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  player: one(users, {
    fields: [analyticsEvents.playerId],
    references: [users.id],
  }),
  caseDefinition: one(caseDefinitions, {
    fields: [analyticsEvents.caseDefinitionId],
    references: [caseDefinitions.id],
  }),
}));
