import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

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

export const usersRelations = relations(users, ({ many }) => ({
  playerCases: many(playerCases),
}));

export const caseDefinitionsRelations = relations(caseDefinitions, ({ many }) => ({
  playerCases: many(playerCases),
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
}));

export const notesRelations = relations(notes, ({ one }) => ({
  playerCase: one(playerCases, {
    fields: [notes.playerCaseId],
    references: [playerCases.id],
  }),
}));
