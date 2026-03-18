"use server";

import { db } from "@/lib/db";
import {
  grades,
  submissions,
  assignments,
  modules,
  moduleCompletions,
  enrollments,
  feedbackEntries,
  auditLogs,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

export type ActionResult = { error: string } | { success: true };

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireGrader() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    redirect("/lms/dashboard");
  }
  return session;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const gradeSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  score: z.coerce
    .number({ error: "Score must be a number" })
    .min(0, "Score cannot be negative"),
  comment: z.string().max(2000).optional(),
});

// ─── Save grade as draft ──────────────────────────────────────────────────────

export async function saveDraftGradeAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireGrader();

  const parse = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    score: formData.get("score"),
    comment: formData.get("comment") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { submissionId, score, comment } = parse.data;

  // Fetch submission + assignment to validate score <= maxScore
  const [row] = await db
    .select({
      submission: submissions,
      maxScore: assignments.maxScore,
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!row) return { error: "Submission not found" };

  const maxScore = Number(row.maxScore);
  if (score > maxScore)
    return { error: `Score cannot exceed max score of ${maxScore}` };

  // Upsert grade (insert or update)
  const [existing] = await db
    .select({ id: grades.id })
    .from(grades)
    .where(eq(grades.submissionId, submissionId))
    .limit(1);

  const now = new Date();

  if (existing) {
    const [old] = await db
      .select()
      .from(grades)
      .where(eq(grades.id, existing.id))
      .limit(1);

    await db
      .update(grades)
      .set({
        score: String(score),
        comment: comment ?? null,
        gradedBy: session.user.id,
        gradedAt: now,
        status: "draft",
        updatedAt: now,
      })
      .where(eq(grades.id, existing.id));

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "grade_updated",
      entity: "grades",
      entityId: existing.id,
      oldData: old as unknown as Record<string, unknown>,
      newData: { score, comment, status: "draft" } as unknown as Record<string, unknown>,
    });
  } else {
    const [created] = await db
      .insert(grades)
      .values({
        submissionId,
        score: String(score),
        comment: comment ?? null,
        gradedBy: session.user.id,
        gradedAt: now,
        status: "draft",
      })
      .returning({ id: grades.id });

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "grade_drafted",
      entity: "grades",
      entityId: created.id,
      newData: { submissionId, score, comment } as unknown as Record<string, unknown>,
    });
  }

  revalidatePath("/lms/grading");
  return { success: true };
}

// ─── Publish grade ────────────────────────────────────────────────────────────

export async function publishGradeAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireGrader();

  const parse = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    score: formData.get("score"),
    comment: formData.get("comment") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { submissionId, score, comment } = parse.data;

  // Validate score against max
  const [row] = await db
    .select({
      submission: submissions,
      maxScore: assignments.maxScore,
      moduleId: assignments.moduleId,
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!row) return { error: "Submission not found" };

  const maxScore = Number(row.maxScore);
  if (score > maxScore)
    return { error: `Score cannot exceed max score of ${maxScore}` };

  const now = new Date();

  const [existing] = await db
    .select({ id: grades.id })
    .from(grades)
    .where(eq(grades.submissionId, submissionId))
    .limit(1);

  let gradeId: string;

  if (existing) {
    await db
      .update(grades)
      .set({
        score: String(score),
        comment: comment ?? null,
        gradedBy: session.user.id,
        gradedAt: now,
        status: "published",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(grades.id, existing.id));

    gradeId = existing.id;
  } else {
    const [created] = await db
      .insert(grades)
      .values({
        submissionId,
        score: String(score),
        comment: comment ?? null,
        gradedBy: session.user.id,
        gradedAt: now,
        status: "published",
        publishedAt: now,
      })
      .returning({ id: grades.id });

    gradeId = created.id;
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "grade_published",
    entity: "grades",
    entityId: gradeId,
    newData: { submissionId, score, comment, publishedAt: now } as unknown as Record<string, unknown>,
  });

  // Attempt to update module completion for this student
  await recalculateModuleCompletion(
    row.submission.studentId,
    row.moduleId,
  );

  revalidatePath("/lms/grading");
  revalidatePath("/lms/dashboard");
  return { success: true };
}

// ─── Publish grade directly by grade ID ──────────────────────────────────────

export async function publishGradeByIdAction(gradeId: string): Promise<ActionResult> {
  const session = await requireGrader();

  const [grade] = await db
    .select()
    .from(grades)
    .where(eq(grades.id, gradeId))
    .limit(1);

  if (!grade) return { error: "Grade not found" };
  if (grade.status === "published") return { error: "Grade is already published" };

  const now = new Date();

  await db
    .update(grades)
    .set({ status: "published", publishedAt: now, updatedAt: now })
    .where(eq(grades.id, gradeId));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "grade_published",
    entity: "grades",
    entityId: gradeId,
    newData: { publishedAt: now } as unknown as Record<string, unknown>,
  });

  revalidatePath("/lms/grading");
  return { success: true };
}

// ─── Bulk publish (all drafts for an offering/module) ────────────────────────

export async function bulkPublishGradesAction(gradeIds: string[]): Promise<ActionResult> {
  const session = await requireGrader();

  if (gradeIds.length === 0) return { error: "No grades provided" };
  if (gradeIds.length > 200) return { error: "Cannot publish more than 200 grades at once" };

  const now = new Date();

  for (const gradeId of gradeIds) {
    await db
      .update(grades)
      .set({ status: "published", publishedAt: now, updatedAt: now })
      .where(and(eq(grades.id, gradeId), eq(grades.status, "draft")));
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "grade_published",
    entity: "grades",
    entityId: null,
    newData: { bulkIds: gradeIds, count: gradeIds.length } as unknown as Record<string, unknown>,
  });

  revalidatePath("/lms/grading");
  return { success: true };
}

// ─── MCQ Auto-grading ─────────────────────────────────────────────────────────

export async function autoGradeMcqAction(submissionId: string): Promise<ActionResult> {
  const session = await requireGrader();

  // Get submission + all answers with correct flag + assignment maxScore
  const [subRow] = await db
    .select({
      studentId: submissions.studentId,
      assignmentId: submissions.assignmentId,
      moduleId: assignments.moduleId,
      maxScore: assignments.maxScore,
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!subRow) return { error: "Submission not found" };

  // Import mcqAnswers and mcqQuestions for calculation
  const { mcqAnswers, mcqQuestions } = await import("@/lib/db/schema");

  // Total points available
  const questionRows = await db
    .select({ id: mcqQuestions.id, points: mcqQuestions.points })
    .from(mcqQuestions)
    .where(eq(mcqQuestions.assignmentId, subRow.assignmentId));

  const totalPoints = questionRows.reduce((sum, q) => sum + Number(q.points), 0);
  if (totalPoints === 0) return { error: "Assignment has no questions with points" };

  // Correct answers count (weighted)
  const answerRows = await db
    .select({
      isCorrect: mcqAnswers.isCorrect,
      questionId: mcqAnswers.questionId,
    })
    .from(mcqAnswers)
    .where(eq(mcqAnswers.submissionId, submissionId));

  let earnedPoints = 0;
  for (const ans of answerRows) {
    if (ans.isCorrect) {
      const q = questionRows.find((q) => q.id === ans.questionId);
      if (q) earnedPoints += Number(q.points);
    }
  }

  // Compute final score: (earnedPoints / totalPoints) * maxScore
  const maxScore = Number(subRow.maxScore);
  const score = Math.round((earnedPoints / totalPoints) * maxScore * 100) / 100;

  const now = new Date();

  // Upsert published grade immediately (MCQ = auto-publish)
  const [existing] = await db
    .select({ id: grades.id })
    .from(grades)
    .where(eq(grades.submissionId, submissionId))
    .limit(1);

  let gradeId: string;

  if (existing) {
    await db
      .update(grades)
      .set({
        score: String(score),
        gradedBy: session.user.id,
        gradedAt: now,
        status: "published",
        publishedAt: now,
        updatedAt: now,
        comment: `Auto-graded: ${earnedPoints}/${totalPoints} points`,
      })
      .where(eq(grades.id, existing.id));
    gradeId = existing.id;
  } else {
    const [created] = await db
      .insert(grades)
      .values({
        submissionId,
        score: String(score),
        gradedBy: session.user.id,
        gradedAt: now,
        status: "published",
        publishedAt: now,
        comment: `Auto-graded: ${earnedPoints}/${totalPoints} points`,
      })
      .returning({ id: grades.id });
    gradeId = created.id;
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "grade_published",
    entity: "grades",
    entityId: gradeId,
    newData: {
      submissionId,
      score,
      autoGraded: true,
      earnedPoints,
      totalPoints,
    } as unknown as Record<string, unknown>,
  });

  await recalculateModuleCompletion(subRow.studentId, subRow.moduleId);

  revalidatePath("/lms/grading");
  return { success: true };
}

// ─── Module completion recalculation ─────────────────────────────────────────

async function recalculateModuleCompletion(
  studentId: string,
  moduleId: string,
): Promise<void> {
  // Get all required assignments for this module
  const requiredAssignments = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(
        eq(assignments.moduleId, moduleId),
        eq(assignments.isRequired, true),
        eq(assignments.isPublished, true),
      ),
    );

  if (requiredAssignments.length === 0) return;

  // Check that all required assignments are submitted
  for (const assignment of requiredAssignments) {
    const [sub] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignment.id),
          eq(submissions.studentId, studentId),
        ),
      )
      .limit(1);

    if (!sub) return; // Not all submitted yet
  }

  // Check that all 3 feedback types are submitted
  const feedbackTypes = ["assistant", "session", "laboratory"] as const;
  for (const type of feedbackTypes) {
    const [fb] = await db
      .select({ id: feedbackEntries.id })
      .from(feedbackEntries)
      .where(
        and(
          eq(feedbackEntries.studentId, studentId),
          eq(feedbackEntries.moduleId, moduleId),
          eq(feedbackEntries.type, type),
        ),
      )
      .limit(1);

    if (!fb) return; // Feedback not yet complete
  }

  // All conditions met — mark module as complete
  const [existing] = await db
    .select({ id: moduleCompletions.id })
    .from(moduleCompletions)
    .where(
      and(
        eq(moduleCompletions.moduleId, moduleId),
        eq(moduleCompletions.studentId, studentId),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    await db
      .update(moduleCompletions)
      .set({ isComplete: true, completedAt: now, updatedAt: now })
      .where(eq(moduleCompletions.id, existing.id));
  } else {
    await db.insert(moduleCompletions).values({
      moduleId,
      studentId,
      isComplete: true,
      completedAt: now,
    });
  }
}
