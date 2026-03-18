import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { courseOfferings } from "./courses";
import { modules } from "./modules";
import { assignments } from "./assignments";
import { groups } from "./groups";

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "excused",
  "late",
]);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id),
    studentId: uuid("student_id").notNull(),
    recordedBy: uuid("recorded_by").notNull(),
    status: attendanceStatusEnum("status").notNull().default("present"),
    notes: text("notes"),
    sessionDate: timestamp("session_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("uq_attendance").on(t.offeringId, t.moduleId, t.studentId)],
);

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert;

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => courseOfferings.id),
  certificateNumber: text("certificate_number").notNull().unique(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  issuedBy: uuid("issued_by").notNull(),
  filePath: text("file_path"),
  templateData: text("template_data"), // JSON snapshot of certificate data
  revokedAt: timestamp("revoked_at"),
  revokedBy: uuid("revoked_by"),
  revokedReason: text("revoked_reason"),
});

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

// ─── Discussion Threads ───────────────────────────────────────────────────────

export const discussionThreads = pgTable("discussion_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id),
  authorId: uuid("author_id").notNull(),
  title: text("title").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discussionPosts = pgTable("discussion_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => discussionThreads.id),
  authorId: uuid("author_id").notNull(),
  parentId: uuid("parent_id"), // self-reference for nested replies (NULL = top-level)
  content: text("content").notNull(),
  isAnswer: boolean("is_answer").notNull().default(false), // marked as accepted answer
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discussionReactions = pgTable(
  "discussion_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => discussionPosts.id),
    userId: uuid("user_id").notNull(),
    emoji: text("emoji").notNull().default("👍"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("uq_reaction").on(t.postId, t.userId, t.emoji)],
);

export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type NewDiscussionThread = typeof discussionThreads.$inferInsert;
export type DiscussionPost = typeof discussionPosts.$inferSelect;
export type NewDiscussionPost = typeof discussionPosts.$inferInsert;

// ─── Group (Collaborative) Submissions ───────────────────────────────────────

export const groupSubmissions = pgTable(
  "group_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    submittedBy: uuid("submitted_by").notNull(), // the student who pressed submit
    filePath: text("file_path"),
    textAnswer: text("text_answer"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    isLate: boolean("is_late").notNull().default(false),
    version: integer("version").notNull().default(1),
  },
  (t) => [unique("uq_group_submission").on(t.assignmentId, t.groupId)],
);

export const groupSubmissionHistory = pgTable("group_submission_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupSubmissionId: uuid("group_submission_id")
    .notNull()
    .references(() => groupSubmissions.id),
  assignmentId: uuid("assignment_id").notNull(),
  groupId: uuid("group_id").notNull(),
  submittedBy: uuid("submitted_by").notNull(),
  filePath: text("file_path"),
  textAnswer: text("text_answer"),
  submittedAt: timestamp("submitted_at").notNull(),
  version: integer("version").notNull(),
  replacedAt: timestamp("replaced_at").notNull().defaultNow(),
});

export type GroupSubmission = typeof groupSubmissions.$inferSelect;
export type NewGroupSubmission = typeof groupSubmissions.$inferInsert;

// ─── Study Group Invites ──────────────────────────────────────────────────────

export const studyGroupInvites = pgTable("study_group_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => courseOfferings.id),
  invitedBy: uuid("invited_by").notNull(),
  email: text("email"), // NULL = link-only invite (no specific email)
  token: text("token").notNull().unique(),
  maxUses: integer("max_uses"), // NULL = unlimited
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  acceptedBy: uuid("accepted_by"),
  isRevoked: boolean("is_revoked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type StudyGroupInvite = typeof studyGroupInvites.$inferSelect;
export type NewStudyGroupInvite = typeof studyGroupInvites.$inferInsert;
