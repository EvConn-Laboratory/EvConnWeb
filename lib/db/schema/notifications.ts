import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "grade_published",
  "submission_received",
  "assignment_due",
  "module_opened",
  "module_closed",
  "announcement",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
