import { pgTable, text, uuid, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { courseOfferings } from "./courses";

export const moduleStatusEnum = pgEnum("module_status", ["draft", "scheduled", "open", "closed"]);

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id").notNull().references(() => courseOfferings.id),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  openDatetime: timestamp("open_datetime"),
  closeDatetime: timestamp("close_datetime"),
  status: moduleStatusEnum("status").notNull().default("draft"),
  manualOverride: text("manual_override"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  contentData: text("content_data").notNull().default("{}"),
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const moduleCompletions = pgTable("module_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id),
  studentId: uuid("student_id").notNull(),
  isComplete: boolean("is_complete").notNull().default(false),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
