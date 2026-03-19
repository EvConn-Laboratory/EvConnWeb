import { pgTable, text, uuid, timestamp, unique, integer } from "drizzle-orm/pg-core";
import { courseOfferings } from "./courses";

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_group_number").on(t.offeringId, t.number),
]);

export const groupAssistants = pgTable("group_assistants", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  assistantId: uuid("assistant_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
