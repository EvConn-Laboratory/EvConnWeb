import { pgTable, text, uuid, timestamp, integer, pgEnum, unique } from "drizzle-orm/pg-core";
import { modules } from "./modules";
import { courseOfferings } from "./courses";

export const feedbackTypeEnum = pgEnum("feedback_type", ["assistant", "session", "laboratory"]);

export const feedbackEntries = pgTable("feedback_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull(),
  offeringId: uuid("offering_id").notNull().references(() => courseOfferings.id),
  moduleId: uuid("module_id").notNull().references(() => modules.id),
  assistantId: uuid("assistant_id"),
  type: feedbackTypeEnum("type").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_feedback").on(t.studentId, t.moduleId, t.type),
]);

export type FeedbackEntry = typeof feedbackEntries.$inferSelect;
export type NewFeedbackEntry = typeof feedbackEntries.$inferInsert;
