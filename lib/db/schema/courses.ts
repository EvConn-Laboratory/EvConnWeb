import { pgTable, text, uuid, boolean, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";

export const courseTypeEnum = pgEnum("course_type", ["praktikum", "study_group"]);
export const offeringStatusEnum = pgEnum("offering_status", ["draft", "active", "closed", "archived"]);
export const offeringVisibilityEnum = pgEnum("offering_visibility", ["internal", "public"]);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  thumbnailPath: text("thumbnail_path"),
  type: courseTypeEnum("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courseOfferings = pgTable("course_offerings", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  semester: text("semester").notNull(),
  academicYear: text("academic_year").notNull(),
  hari: text("hari"),
  shift: text("shift"),
  enrollmentKey: text("enrollment_key"),
  status: offeringStatusEnum("status").notNull().default("draft"),
  visibility: offeringVisibilityEnum("visibility").notNull().default("internal"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_offering").on(t.courseId, t.semester, t.hari, t.shift),
]);

export const offeringAssistants = pgTable("offering_assistants", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  assistantId: uuid("assistant_id").notNull(),
  isLead: boolean("is_lead").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull(),
  groupId: uuid("group_id"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  jurusan: text("jurusan"),
  kelas: text("kelas"),
  kelompokCsv: text("kelompok_csv"),
}, (t) => [
  unique("uq_enrollment").on(t.offeringId, t.studentId),
]);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseOffering = typeof courseOfferings.$inferSelect;
export type NewCourseOffering = typeof courseOfferings.$inferInsert;
