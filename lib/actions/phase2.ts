"use server";

import { db } from "@/lib/db";
import {
  attendanceRecords,
  certificates,
  discussionThreads,
  discussionPosts,
  discussionReactions,
  studyGroupInvites,
  enrollments,
  courseOfferings,
  modules,
  auditLogs,
  users,
  groupSubmissions,
  groupSubmissionHistory,
  assignments,
  groups,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, isNull, desc, asc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { error: string };

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    throw new Error("Unauthorized: staff only");
  }
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: admin only");
  }
  return session;
}

// =============================================================================
// ATTENDANCE
// =============================================================================

const attendanceSchema = z.object({
  offeringId: z.string().uuid("Invalid offering ID"),
  moduleId: z.string().uuid("Invalid module ID"),
  sessionDate: z.string().min(1, "Session date is required"),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: z.enum(["present", "absent", "excused", "late"]),
        notes: z.string().max(500).optional(),
      }),
    )
    .min(1, "At least one attendance record is required"),
});

/**
 * Save attendance for an entire session at once.
 * Assistants call this once per module session with the full class roster.
 */
export async function saveAttendanceAction(
  data: z.infer<typeof attendanceSchema>,
): Promise<ActionResult<{ saved: number; updated: number }>> {
  const session = await requireStaff();

  const parse = attendanceSchema.safeParse(data);
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { offeringId, moduleId, sessionDate, records } = parse.data;
  const date = new Date(sessionDate);

  let saved = 0;
  let updated = 0;

  for (const record of records) {
    // Check if a record already exists for this student + module
    const [existing] = await db
      .select({ id: attendanceRecords.id })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.offeringId, offeringId),
          eq(attendanceRecords.moduleId, moduleId),
          eq(attendanceRecords.studentId, record.studentId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(attendanceRecords)
        .set({
          status: record.status,
          notes: record.notes ?? null,
          recordedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(attendanceRecords.id, existing.id));
      updated++;
    } else {
      await db.insert(attendanceRecords).values({
        offeringId,
        moduleId,
        studentId: record.studentId,
        recordedBy: session.user.id,
        status: record.status,
        notes: record.notes ?? null,
        sessionDate: date,
      });
      saved++;
    }
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "attendance_recorded",
    entity: "attendance_records",
    entityId: moduleId,
    newData: {
      offeringId,
      moduleId,
      sessionDate,
      saved,
      updated,
    } as unknown as Record<string, unknown>,
  });

  revalidatePath(`/lms/offerings/${offeringId}/modules/${moduleId}/attendance`);
  return { success: true, data: { saved, updated } };
}

/**
 * Update a single student's attendance record.
 */
export async function updateAttendanceRecordAction(
  recordId: string,
  status: "present" | "absent" | "excused" | "late",
  notes?: string,
): Promise<ActionResult> {
  const session = await requireStaff();

  await db
    .update(attendanceRecords)
    .set({
      status,
      notes: notes ?? null,
      recordedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(attendanceRecords.id, recordId));

  return { success: true };
}

/**
 * Get attendance records for a module session.
 */
export async function getAttendanceByModuleAction(
  offeringId: string,
  moduleId: string,
) {
  const session = await requireAuth();

  const records = await db
    .select({
      id: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      sessionDate: attendanceRecords.sessionDate,
      recordedBy: attendanceRecords.recordedBy,
      studentName: users.name,
      studentNim: users.nim,
    })
    .from(attendanceRecords)
    .innerJoin(users, eq(attendanceRecords.studentId, users.id))
    .where(
      and(
        eq(attendanceRecords.offeringId, offeringId),
        eq(attendanceRecords.moduleId, moduleId),
      ),
    )
    .orderBy(asc(users.name));

  return records;
}

/**
 * Get attendance summary for a student across all modules in an offering.
 */
export async function getStudentAttendanceSummaryAction(
  studentId: string,
  offeringId: string,
) {
  const session = await requireAuth();

  // Students can only see their own summary
  if (
    session.user.role === "student" &&
    session.user.id !== studentId
  ) {
    return null;
  }

  const records = await db
    .select({
      moduleId: attendanceRecords.moduleId,
      status: attendanceRecords.status,
      sessionDate: attendanceRecords.sessionDate,
      moduleTitle: modules.title,
      moduleOrder: modules.orderIndex,
    })
    .from(attendanceRecords)
    .innerJoin(modules, eq(attendanceRecords.moduleId, modules.id))
    .where(
      and(
        eq(attendanceRecords.studentId, studentId),
        eq(attendanceRecords.offeringId, offeringId),
      ),
    )
    .orderBy(asc(modules.orderIndex));

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const attendanceRate =
    total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return {
    records,
    summary: { total, present, late, absent, excused, attendanceRate },
  };
}

// =============================================================================
// DISCUSSION FORUM
// =============================================================================

const createThreadSchema = z.object({
  moduleId: z.string().uuid("Invalid module ID"),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title too long"),
});

const createPostSchema = z.object({
  threadId: z.string().uuid("Invalid thread ID"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content too long"),
  parentId: z.string().uuid().optional(),
});

const updatePostSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

/**
 * Create a new discussion thread for a module.
 */
export async function createThreadAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ threadId: string }>> {
  const session = await requireAuth();

  const parse = createThreadSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { moduleId, title } = parse.data;

  const [thread] = await db
    .insert(discussionThreads)
    .values({
      moduleId,
      authorId: session.user.id,
      title,
    })
    .returning({ id: discussionThreads.id });

  revalidatePath(`/lms/modules/${moduleId}/discussion`);
  return { success: true, data: { threadId: thread.id } };
}

/**
 * Post a reply to a thread (top-level or nested).
 */
export async function createPostAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ postId: string }>> {
  const session = await requireAuth();

  const parse = createPostSchema.safeParse({
    threadId: formData.get("threadId"),
    content: formData.get("content"),
    parentId: formData.get("parentId") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { threadId, content, parentId } = parse.data;

  // Check thread exists and is not locked
  const [thread] = await db
    .select({ id: discussionThreads.id, isLocked: discussionThreads.isLocked, moduleId: discussionThreads.moduleId })
    .from(discussionThreads)
    .where(eq(discussionThreads.id, threadId))
    .limit(1);

  if (!thread) return { error: "Thread not found" };
  if (thread.isLocked && session.user.role === "student") {
    return { error: "This thread has been locked by an instructor" };
  }

  const [post] = await db
    .insert(discussionPosts)
    .values({
      threadId,
      authorId: session.user.id,
      content,
      parentId: parentId ?? null,
    })
    .returning({ id: discussionPosts.id });

  // Update thread reply count and last activity
  await db
    .update(discussionThreads)
    .set({
      replyCount: sql`${discussionThreads.replyCount} + 1`,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(discussionThreads.id, threadId));

  revalidatePath(`/lms/modules/${thread.moduleId}/discussion/${threadId}`);
  return { success: true, data: { postId: post.id } };
}

/**
 * Edit an existing post (author only, or admin).
 */
export async function editPostAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAuth();

  const parse = updatePostSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { postId, content } = parse.data;

  const [post] = await db
    .select({ authorId: discussionPosts.authorId, deletedAt: discussionPosts.deletedAt })
    .from(discussionPosts)
    .where(eq(discussionPosts.id, postId))
    .limit(1);

  if (!post) return { error: "Post not found" };
  if (post.deletedAt) return { error: "Post has been deleted" };
  if (
    post.authorId !== session.user.id &&
    session.user.role !== "super_admin"
  ) {
    return { error: "You can only edit your own posts" };
  }

  await db
    .update(discussionPosts)
    .set({
      content,
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(discussionPosts.id, postId));

  return { success: true };
}

/**
 * Soft-delete a post (author or admin/assistant).
 */
export async function deletePostAction(postId: string): Promise<ActionResult> {
  const session = await requireAuth();

  const [post] = await db
    .select({ authorId: discussionPosts.authorId, threadId: discussionPosts.threadId })
    .from(discussionPosts)
    .where(eq(discussionPosts.id, postId))
    .limit(1);

  if (!post) return { error: "Post not found" };

  const isAuthor = post.authorId === session.user.id;
  const isStaff =
    session.user.role === "super_admin" || session.user.role === "assistant";

  if (!isAuthor && !isStaff) {
    return { error: "You don't have permission to delete this post" };
  }

  await db
    .update(discussionPosts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(discussionPosts.id, postId));

  // Decrement thread reply count
  await db
    .update(discussionThreads)
    .set({
      replyCount: sql`GREATEST(${discussionThreads.replyCount} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(discussionThreads.id, post.threadId));

  return { success: true };
}

/**
 * Toggle a reaction (emoji) on a post.
 * If the reaction already exists, it is removed (toggle behavior).
 */
export async function toggleReactionAction(
  postId: string,
  emoji = "👍",
): Promise<ActionResult<{ added: boolean }>> {
  const session = await requireAuth();

  const [existing] = await db
    .select({ id: discussionReactions.id })
    .from(discussionReactions)
    .where(
      and(
        eq(discussionReactions.postId, postId),
        eq(discussionReactions.userId, session.user.id),
        eq(discussionReactions.emoji, emoji),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(discussionReactions)
      .where(eq(discussionReactions.id, existing.id));
    return { success: true, data: { added: false } };
  }

  await db.insert(discussionReactions).values({
    postId,
    userId: session.user.id,
    emoji,
  });

  return { success: true, data: { added: true } };
}

/**
 * Mark a post as the accepted answer for a thread (thread author or staff).
 */
export async function markAnswerAction(
  postId: string,
  threadId: string,
): Promise<ActionResult> {
  const session = await requireAuth();

  const [thread] = await db
    .select({ authorId: discussionThreads.authorId })
    .from(discussionThreads)
    .where(eq(discussionThreads.id, threadId))
    .limit(1);

  if (!thread) return { error: "Thread not found" };

  const canMark =
    thread.authorId === session.user.id ||
    session.user.role === "assistant" ||
    session.user.role === "super_admin";

  if (!canMark) return { error: "Only the thread author or staff can mark an answer" };

  // Clear existing accepted answers in the thread
  await db
    .update(discussionPosts)
    .set({ isAnswer: false, updatedAt: new Date() })
    .where(
      and(
        eq(discussionPosts.threadId, threadId),
        eq(discussionPosts.isAnswer, true),
      ),
    );

  // Mark the selected post
  await db
    .update(discussionPosts)
    .set({ isAnswer: true, updatedAt: new Date() })
    .where(eq(discussionPosts.id, postId));

  return { success: true };
}

/**
 * Pin or unpin a thread (staff only).
 */
export async function pinThreadAction(
  threadId: string,
  isPinned: boolean,
): Promise<ActionResult> {
  await requireStaff();

  await db
    .update(discussionThreads)
    .set({ isPinned, updatedAt: new Date() })
    .where(eq(discussionThreads.id, threadId));

  return { success: true };
}

/**
 * Lock or unlock a thread (staff only).
 */
export async function lockThreadAction(
  threadId: string,
  isLocked: boolean,
): Promise<ActionResult> {
  await requireStaff();

  await db
    .update(discussionThreads)
    .set({ isLocked, updatedAt: new Date() })
    .where(eq(discussionThreads.id, threadId));

  return { success: true };
}

/**
 * Get all threads for a module, sorted by pinned first then latest activity.
 */
export async function getThreadsByModuleAction(moduleId: string) {
  const session = await requireAuth();

  const threads = await db
    .select({
      id: discussionThreads.id,
      title: discussionThreads.title,
      authorId: discussionThreads.authorId,
      authorName: users.name,
      isPinned: discussionThreads.isPinned,
      isLocked: discussionThreads.isLocked,
      viewCount: discussionThreads.viewCount,
      replyCount: discussionThreads.replyCount,
      lastActivityAt: discussionThreads.lastActivityAt,
      createdAt: discussionThreads.createdAt,
    })
    .from(discussionThreads)
    .innerJoin(users, eq(discussionThreads.authorId, users.id))
    .where(eq(discussionThreads.moduleId, moduleId))
    .orderBy(
      desc(discussionThreads.isPinned),
      desc(discussionThreads.lastActivityAt),
    );

  return threads;
}

/**
 * Get all posts in a thread (flat list; client renders as tree).
 */
export async function getPostsByThreadAction(threadId: string) {
  const session = await requireAuth();

  // Increment view count
  await db
    .update(discussionThreads)
    .set({
      viewCount: sql`${discussionThreads.viewCount} + 1`,
    })
    .where(eq(discussionThreads.id, threadId));

  const posts = await db
    .select({
      id: discussionPosts.id,
      threadId: discussionPosts.threadId,
      parentId: discussionPosts.parentId,
      authorId: discussionPosts.authorId,
      authorName: users.name,
      content: discussionPosts.content,
      isAnswer: discussionPosts.isAnswer,
      isEdited: discussionPosts.isEdited,
      editedAt: discussionPosts.editedAt,
      deletedAt: discussionPosts.deletedAt,
      createdAt: discussionPosts.createdAt,
    })
    .from(discussionPosts)
    .innerJoin(users, eq(discussionPosts.authorId, users.id))
    .where(eq(discussionPosts.threadId, threadId))
    .orderBy(asc(discussionPosts.createdAt));

  return posts;
}

// =============================================================================
// CERTIFICATES
// =============================================================================

const issueCertificateSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  offeringId: z.string().uuid("Invalid offering ID"),
});

/**
 * Issue a completion certificate for a student in an offering.
 * Admin/assistant only — triggered manually or automatically on module completion.
 */
export async function issueCertificateAction(
  data: z.infer<typeof issueCertificateSchema>,
): Promise<ActionResult<{ certificateId: string; certificateNumber: string }>> {
  const session = await requireStaff();

  const parse = issueCertificateSchema.safeParse(data);
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { studentId, offeringId } = parse.data;

  // Check if certificate already issued
  const [existing] = await db
    .select({ id: certificates.id, certificateNumber: certificates.certificateNumber })
    .from(certificates)
    .where(
      and(
        eq(certificates.studentId, studentId),
        eq(certificates.offeringId, offeringId),
        isNull(certificates.revokedAt),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      error: `Certificate already issued: ${existing.certificateNumber}`,
    };
  }

  // Fetch student + offering data for the certificate
  const [student] = await db
    .select({ name: users.name, nim: users.nim })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (!student) return { error: "Student not found" };

  const [offering] = await db
    .select({
      semester: courseOfferings.semester,
      academicYear: courseOfferings.academicYear,
    })
    .from(courseOfferings)
    .where(eq(courseOfferings.id, offeringId))
    .limit(1);

  if (!offering) return { error: "Offering not found" };

  // Generate a unique certificate number: CERT-{YEAR}-{6 random hex chars}
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  const certificateNumber = `CERT-${year}-${suffix}`;

  // Template data snapshot
  const templateData = JSON.stringify({
    studentName: student.name,
    studentNim: student.nim ?? "",
    semester: offering.semester,
    academicYear: offering.academicYear,
    issuedAt: new Date().toISOString(),
    issuedBy: session.user.name,
  });

  const [cert] = await db
    .insert(certificates)
    .values({
      studentId,
      offeringId,
      certificateNumber,
      issuedBy: session.user.id,
      templateData,
    })
    .returning({ id: certificates.id });

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "certificate_issued",
    entity: "certificates",
    entityId: cert.id,
    newData: {
      studentId,
      offeringId,
      certificateNumber,
    } as unknown as Record<string, unknown>,
  });

  revalidatePath(`/admin/certificates`);
  revalidatePath(`/lms/certificates`);
  return { success: true, data: { certificateId: cert.id, certificateNumber } };
}

/**
 * Revoke a certificate (admin only).
 */
export async function revokeCertificateAction(
  certificateId: string,
  reason: string,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const [cert] = await db
    .select({ id: certificates.id, revokedAt: certificates.revokedAt })
    .from(certificates)
    .where(eq(certificates.id, certificateId))
    .limit(1);

  if (!cert) return { error: "Certificate not found" };
  if (cert.revokedAt) return { error: "Certificate is already revoked" };

  await db
    .update(certificates)
    .set({
      revokedAt: new Date(),
      revokedBy: session.user.id,
      revokedReason: reason,
    })
    .where(eq(certificates.id, certificateId));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "certificate_revoked",
    entity: "certificates",
    entityId: certificateId,
    newData: { reason } as unknown as Record<string, unknown>,
  });

  revalidatePath(`/admin/certificates`);
  return { success: true };
}

/**
 * Get all certificates for a student.
 */
export async function getStudentCertificatesAction(studentId: string) {
  const session = await requireAuth();

  if (session.user.role === "student" && session.user.id !== studentId) {
    return [];
  }

  const certs = await db
    .select()
    .from(certificates)
    .where(
      and(eq(certificates.studentId, studentId), isNull(certificates.revokedAt)),
    )
    .orderBy(desc(certificates.issuedAt));

  return certs;
}

/**
 * Verify a certificate by its number (public — no auth required).
 */
export async function verifyCertificateAction(certificateNumber: string) {
  const [cert] = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      issuedAt: certificates.issuedAt,
      revokedAt: certificates.revokedAt,
      templateData: certificates.templateData,
      studentName: users.name,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.studentId, users.id))
    .where(eq(certificates.certificateNumber, certificateNumber))
    .limit(1);

  if (!cert) return { valid: false, reason: "Certificate not found" };
  if (cert.revokedAt)
    return { valid: false, reason: "Certificate has been revoked" };

  return {
    valid: true,
    certificate: {
      number: cert.certificateNumber,
      issuedAt: cert.issuedAt,
      studentName: cert.studentName,
      data: cert.templateData ? JSON.parse(cert.templateData) : {},
    },
  };
}

// =============================================================================
// STUDY GROUP INVITES
// =============================================================================

const createInviteSchema = z.object({
  offeringId: z.string().uuid("Invalid offering ID"),
  email: z.string().email("Invalid email").optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
});

/**
 * Generate an invite link for a Study Group offering.
 * Can be a single-use invite for a specific email, or a reusable link.
 */
export async function createStudyGroupInviteAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ token: string; inviteUrl: string }>> {
  const session = await requireStaff();

  const parse = createInviteSchema.safeParse({
    offeringId: formData.get("offeringId"),
    email: formData.get("email") || undefined,
    maxUses: formData.get("maxUses") || undefined,
    expiresInDays: formData.get("expiresInDays") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { offeringId, email, maxUses, expiresInDays } = parse.data;

  // Verify the offering is a study_group type
  const [offering] = await db
    .select({
      id: courseOfferings.id,
      status: courseOfferings.status,
      visibility: courseOfferings.visibility,
    })
    .from(courseOfferings)
    .where(eq(courseOfferings.id, offeringId))
    .limit(1);

  if (!offering) return { error: "Offering not found" };
  if (offering.status !== "active")
    return { error: "Can only invite to active offerings" };

  // Generate cryptographically secure token
  const token = randomBytes(24).toString("base64url");

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await db.insert(studyGroupInvites).values({
    offeringId,
    invitedBy: session.user.id,
    email: email ?? null,
    token,
    maxUses: maxUses ?? null,
    expiresAt: expiresAt ?? undefined,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const inviteUrl = `${appUrl}/join/${token}`;

  revalidatePath(`/admin/courses/offerings/${offeringId}/invites`);
  return { success: true, data: { token, inviteUrl } };
}

/**
 * Accept a study group invite and enroll the current user.
 */
export async function acceptStudyGroupInviteAction(
  token: string,
): Promise<ActionResult<{ offeringId: string }>> {
  const session = await requireAuth();

  // Fetch the invite
  const [invite] = await db
    .select()
    .from(studyGroupInvites)
    .where(eq(studyGroupInvites.token, token))
    .limit(1);

  if (!invite) return { error: "Invalid invite link" };
  if (invite.isRevoked) return { error: "This invite has been revoked" };
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return { error: "This invite link has expired" };
  }
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return { error: "This invite link has reached its maximum number of uses" };
  }
  if (invite.email) {
    // If email-specific invite, verify the authenticated user's email matches.
    const [userRow] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!userRow || userRow.email !== invite.email) {
      return { error: "This invite is for a different email address" };
    }
  }

  // Check if already enrolled
  const [existingEnrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.offeringId, invite.offeringId),
        eq(enrollments.studentId, session.user.id),
      ),
    )
    .limit(1);

  if (existingEnrollment) {
    return { error: "You are already enrolled in this study group" };
  }

  // Enroll the student
  await db.insert(enrollments).values({
    offeringId: invite.offeringId,
    studentId: session.user.id,
  });

  // Increment use count and record acceptance
  await db
    .update(studyGroupInvites)
    .set({
      useCount: sql`${studyGroupInvites.useCount} + 1`,
      acceptedAt: new Date(),
      acceptedBy: session.user.id,
    })
    .where(eq(studyGroupInvites.id, invite.id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "study_group_invite_accepted",
    entity: "study_group_invites",
    entityId: invite.id,
    newData: {
      offeringId: invite.offeringId,
    } as unknown as Record<string, unknown>,
  });

  revalidatePath("/lms/courses");
  return { success: true, data: { offeringId: invite.offeringId } };
}

// =============================================================================
// GROUP (COLLABORATIVE) SUBMISSIONS
// =============================================================================

const groupSubmitSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  groupId: z.string().uuid("Invalid group ID"),
  textAnswer: z.string().optional(),
  filePath: z.string().optional(),
});

/**
 * Submit (or re-submit) a group assignment on behalf of the submitting student.
 * Archives the previous submission to groupSubmissionHistory before updating.
 */
export async function submitGroupAssignmentAction(
  data: z.infer<typeof groupSubmitSchema>,
): Promise<ActionResult<{ submissionId: string }>> {
  const session = await requireAuth();

  const parse = groupSubmitSchema.safeParse(data);
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { assignmentId, groupId, textAnswer, filePath } = parse.data;

  // Verify the authenticated user is a member of this group via enrollments
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, session.user.id),
        eq(enrollments.groupId, groupId),
      ),
    )
    .limit(1);

  if (!enrollment) {
    return { error: "You are not a member of this group" };
  }

  // Verify assignment exists, is published, and is marked as a group assignment
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) return { error: "Assignment not found" };
  if (!assignment.isPublished) return { error: "Assignment is not yet available" };
  if (!assignment.isGroupAssignment) {
    return { error: "This assignment is not a group assignment" };
  }

  // Check deadline with grace period (same logic as submitEssayAction)
  if (assignment.deadline) {
    const effectiveDeadline = new Date(assignment.deadline);
    effectiveDeadline.setHours(
      effectiveDeadline.getHours() + (assignment.gracePeriodHours ?? 0),
    );
    if (new Date() > effectiveDeadline) {
      return {
        error:
          assignment.gracePeriodHours > 0
            ? "Submission window (including grace period) has closed"
            : "Submission deadline has passed",
      };
    }
  }

  const isLate = assignment.deadline
    ? new Date() > new Date(assignment.deadline)
    : false;

  // Check for an existing group submission
  const [existing] = await db
    .select()
    .from(groupSubmissions)
    .where(
      and(
        eq(groupSubmissions.assignmentId, assignmentId),
        eq(groupSubmissions.groupId, groupId),
      ),
    )
    .limit(1);

  let submissionId: string;

  if (existing) {
    // Archive old submission to history
    await db.insert(groupSubmissionHistory).values({
      groupSubmissionId: existing.id,
      assignmentId,
      groupId,
      submittedBy: existing.submittedBy,
      filePath: existing.filePath,
      textAnswer: existing.textAnswer,
      submittedAt: existing.submittedAt,
      version: existing.version,
    });

    // Update the current submission record
    await db
      .update(groupSubmissions)
      .set({
        submittedBy: session.user.id,
        filePath: filePath ?? null,
        textAnswer: textAnswer ?? null,
        submittedAt: new Date(),
        isLate,
        version: existing.version + 1,
      })
      .where(eq(groupSubmissions.id, existing.id));

    submissionId = existing.id;
  } else {
    // Insert new group submission
    const [sub] = await db
      .insert(groupSubmissions)
      .values({
        assignmentId,
        groupId,
        submittedBy: session.user.id,
        filePath: filePath ?? null,
        textAnswer: textAnswer ?? null,
        isLate,
      })
      .returning({ id: groupSubmissions.id });

    submissionId = sub.id;
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "group_assignment_submitted",
    entity: "group_submissions",
    entityId: submissionId,
    newData: {
      assignmentId,
      groupId,
      isLate,
      version: existing ? existing.version + 1 : 1,
    } as unknown as Record<string, unknown>,
  });

  revalidatePath(`/lms/assignments/${assignmentId}`);
  return { success: true, data: { submissionId } };
}

/**
 * Get the current group submission for an assignment + group combination.
 * Returns null if no submission has been made yet.
 */
export async function getGroupSubmissionAction(
  assignmentId: string,
  groupId: string,
) {
  await requireAuth();

  const [submission] = await db
    .select({
      id: groupSubmissions.id,
      assignmentId: groupSubmissions.assignmentId,
      groupId: groupSubmissions.groupId,
      submittedBy: groupSubmissions.submittedBy,
      submitterName: users.name,
      filePath: groupSubmissions.filePath,
      textAnswer: groupSubmissions.textAnswer,
      submittedAt: groupSubmissions.submittedAt,
      isLate: groupSubmissions.isLate,
      version: groupSubmissions.version,
    })
    .from(groupSubmissions)
    .innerJoin(users, eq(groupSubmissions.submittedBy, users.id))
    .where(
      and(
        eq(groupSubmissions.assignmentId, assignmentId),
        eq(groupSubmissions.groupId, groupId),
      ),
    )
    .limit(1);

  return submission ?? null;
}

/**
 * Get all group submissions for an offering (assistant/admin view).
 * Joins with assignments, modules, groups and the submitting user.
 */
export async function getGroupSubmissionsForAssistantAction(
  offeringId: string,
) {
  await requireStaff();

  const results = await db
    .select({
      id: groupSubmissions.id,
      assignmentId: groupSubmissions.assignmentId,
      assignmentTitle: assignments.title,
      assignmentType: assignments.type,
      groupId: groupSubmissions.groupId,
      groupNumber: groups.number,
      groupName: groups.name,
      submittedBy: groupSubmissions.submittedBy,
      submitterName: users.name,
      filePath: groupSubmissions.filePath,
      textAnswer: groupSubmissions.textAnswer,
      submittedAt: groupSubmissions.submittedAt,
      isLate: groupSubmissions.isLate,
      version: groupSubmissions.version,
      moduleId: modules.id,
      moduleTitle: modules.title,
      moduleOrder: modules.orderIndex,
    })
    .from(groupSubmissions)
    .innerJoin(assignments, eq(groupSubmissions.assignmentId, assignments.id))
    .innerJoin(modules, eq(assignments.moduleId, modules.id))
    .innerJoin(groups, eq(groupSubmissions.groupId, groups.id))
    .innerJoin(users, eq(groupSubmissions.submittedBy, users.id))
    .where(eq(modules.offeringId, offeringId))
    .orderBy(asc(modules.orderIndex), asc(groups.number));

  return results;
}
