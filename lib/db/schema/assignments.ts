import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { modules } from "./modules";

export const assignmentTypeEnum = pgEnum("assignment_type", [
  "tugas_rumah",
  "tugas_praktikum",
  "study_group_task",
]);
export const assignmentFormatEnum = pgEnum("assignment_format", [
  "mcq",
  "essay_pdf",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "submitted",
  "replaced",
]);
export const gradeStatusEnum = pgEnum("grade_status", ["draft", "published"]);

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id),
  title: text("title").notNull(),
  description: text("description"),
  type: assignmentTypeEnum("type").notNull(),
  format: assignmentFormatEnum("format").notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 })
    .notNull()
    .default("100"),
  deadline: timestamp("deadline"),
  allowResubmit: boolean("allow_resubmit").notNull().default(false),
  isRequired: boolean("is_required").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  gracePeriodHours: integer("grace_period_hours").notNull().default(0),
  isGroupAssignment: boolean("is_group_assignment").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mcqQuestions = pgTable("mcq_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => assignments.id),
  questionText: text("question_text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  points: numeric("points", { precision: 5, scale: 2 }).notNull().default("1"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mcqOptions = pgTable("mcq_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => mcqQuestions.id),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
});

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id),
    studentId: uuid("student_id").notNull(),
    filePath: text("file_path"),
    textAnswer: text("text_answer"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    status: submissionStatusEnum("status").notNull().default("submitted"),
    isLate: boolean("is_late").notNull().default(false),
    version: integer("version").notNull().default(1),
  },
  (t) => [unique("uq_submission").on(t.assignmentId, t.studentId)],
);

export const submissionHistory = pgTable("submission_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id),
  assignmentId: uuid("assignment_id").notNull(),
  studentId: uuid("student_id").notNull(),
  filePath: text("file_path"),
  textAnswer: text("text_answer"),
  submittedAt: timestamp("submitted_at").notNull(),
  version: integer("version").notNull(),
  replacedAt: timestamp("replaced_at").notNull().defaultNow(),
});

export const mcqAnswers = pgTable("mcq_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id),
  questionId: uuid("question_id")
    .notNull()
    .references(() => mcqQuestions.id),
  selectedOptionId: uuid("selected_option_id"),
  isCorrect: boolean("is_correct").notNull().default(false),
});

export const grades = pgTable("grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .unique()
    .references(() => submissions.id),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  gradedBy: uuid("graded_by").notNull(),
  gradedAt: timestamp("graded_at").notNull().defaultNow(),
  comment: text("comment"),
  status: gradeStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type McqQuestion = typeof mcqQuestions.$inferSelect;
export type McqOption = typeof mcqOptions.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
