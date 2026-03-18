"use server";

import { db } from "@/lib/db";
import {
  assignments,
  mcqQuestions,
  mcqOptions,
  mcqAnswers,
  submissions,
  submissionHistory,
  grades,
  modules,
  enrollments,
  auditLogs,
  moduleCompletions,
  feedbackEntries,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, sql, sum, count } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { error: string };

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const assignmentSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["tugas_rumah", "tugas_praktikum", "study_group_task"]),
  format: z.enum(["mcq", "essay_pdf"]),
  maxScore: z.coerce.number().min(1).max(1000).default(100),
  deadline: z.string().optional(),
  allowResubmit: z.coerce.boolean().default(false),
  isRequired: z.coerce.boolean().default(true),
  orderIndex: z.coerce.number().default(0),
  isPublished: z.coerce.boolean().default(false),
  gracePeriodHours: z.coerce.number().min(0).default(0),
  isGroupAssignment: z.coerce.boolean().default(false),
});

const mcqQuestionSchema = z.object({
  assignmentId: z.string().uuid(),
  questionText: z.string().min(1, "Question text is required"),
  orderIndex: z.coerce.number().default(0),
  points: z.coerce.number().min(0.01).default(1),
  options: z
    .array(
      z.object({
        optionText: z.string().min(1),
        isCorrect: z.boolean(),
        orderIndex: z.number(),
      }),
    )
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options"),
});

const essaySubmitSchema = z.object({
  assignmentId: z.string().uuid(),
  textAnswer: z.string().optional(),
});

// ─── Assignment CRUD ──────────────────────────────────────────────────────────

export async function createAssignmentAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireStaff();

  const parse = assignmentSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    format: formData.get("format"),
    maxScore: formData.get("maxScore") ?? 100,
    deadline: formData.get("deadline") || undefined,
    allowResubmit: formData.get("allowResubmit") === "true",
    isRequired: formData.get("isRequired") !== "false",
    orderIndex: formData.get("orderIndex") ?? 0,
    isPublished: formData.get("isPublished") === "true",
    gracePeriodHours: formData.get("gracePeriodHours") ?? 0,
    isGroupAssignment: formData.get("isGroupAssignment") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { deadline, ...rest } = parse.data;

  const [created] = await db
    .insert(assignments)
    .values({
      ...rest,
      maxScore: String(rest.maxScore),
      deadline: deadline ? new Date(deadline) : undefined,
    })
    .returning({ id: assignments.id });

  revalidatePath(`/lms/modules/${parse.data.moduleId}`);
  return { success: true, data: { id: created.id } };
}

export async function updateAssignmentAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = assignmentSchema.partial().safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    type: formData.get("type") || undefined,
    format: formData.get("format") || undefined,
    maxScore: formData.get("maxScore") ?? undefined,
    deadline: formData.get("deadline") || undefined,
    allowResubmit:
      formData.get("allowResubmit") !== null
        ? formData.get("allowResubmit") === "true"
        : undefined,
    isRequired:
      formData.get("isRequired") !== null
        ? formData.get("isRequired") !== "false"
        : undefined,
    isPublished:
      formData.get("isPublished") !== null
        ? formData.get("isPublished") === "true"
        : undefined,
    gracePeriodHours: formData.get("gracePeriodHours") ?? undefined,
    isGroupAssignment:
      formData.get("isGroupAssignment") !== null
        ? formData.get("isGroupAssignment") === "true"
        : undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { deadline, maxScore, ...rest } = parse.data;

  await db
    .update(assignments)
    .set({
      ...rest,
      ...(maxScore !== undefined && { maxScore: String(maxScore) }),
      ...(deadline !== undefined && {
        deadline: deadline ? new Date(deadline) : null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(assignments.id, id));

  return { success: true };
}

export async function publishAssignmentAction(id: string): Promise<ActionResult> {
  await requireStaff();
  await db
    .update(assignments)
    .set({ isPublished: true, updatedAt: new Date() })
    .where(eq(assignments.id, id));
  return { success: true };
}

export async function unpublishAssignmentAction(id: string): Promise<ActionResult> {
  await requireStaff();
  await db
    .update(assignments)
    .set({ isPublished: false, updatedAt: new Date() })
    .where(eq(assignments.id, id));
  return { success: true };
}

export async function deleteAssignmentAction(id: string): Promise<ActionResult> {
  await requireStaff();

  // Cannot delete if there are submissions
  const [subCount] = await db
    .select({ c: count() })
    .from(submissions)
    .where(eq(submissions.assignmentId, id));

  if (subCount.c > 0)
    return {
      error: `Cannot delete: ${subCount.c} submission(s) exist for this assignment.`,
    };

  await db.delete(mcqOptions).where(
    eq(
      mcqOptions.questionId,
      sql`ANY(SELECT id FROM mcq_questions WHERE assignment_id = ${id})`,
    ),
  );
  await db.delete(mcqQuestions).where(eq(mcqQuestions.assignmentId, id));
  await db.delete(assignments).where(eq(assignments.id, id));

  return { success: true };
}

// ─── MCQ Builder ──────────────────────────────────────────────────────────────

export async function upsertMcqQuestionAction(
  data: z.infer<typeof mcqQuestionSchema>,
  existingQuestionId?: string,
): Promise<ActionResult<{ questionId: string }>> {
  await requireStaff();

  const parse = mcqQuestionSchema.safeParse(data);
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { assignmentId, questionText, orderIndex, points, options } = parse.data;

  // Validate exactly one correct answer
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount === 0) return { error: "At least one option must be marked as correct" };

  let questionId = existingQuestionId;

  if (existingQuestionId) {
    // Update existing question
    await db
      .update(mcqQuestions)
      .set({ questionText, orderIndex, points: String(points) })
      .where(eq(mcqQuestions.id, existingQuestionId));

    // Delete existing options and re-insert
    await db
      .delete(mcqOptions)
      .where(eq(mcqOptions.questionId, existingQuestionId));
  } else {
    const [q] = await db
      .insert(mcqQuestions)
      .values({ assignmentId, questionText, orderIndex, points: String(points) })
      .returning({ id: mcqQuestions.id });
    questionId = q.id;
  }

  // Insert options
  await db.insert(mcqOptions).values(
    options.map((o) => ({
      questionId: questionId!,
      optionText: o.optionText,
      isCorrect: o.isCorrect,
      orderIndex: o.orderIndex,
    })),
  );

  return { success: true, data: { questionId: questionId! } };
}

export async function deleteMcqQuestionAction(questionId: string): Promise<ActionResult> {
  await requireStaff();
  await db.delete(mcqOptions).where(eq(mcqOptions.questionId, questionId));
  await db.delete(mcqQuestions).where(eq(mcqQuestions.id, questionId));
  return { success: true };
}

export async function reorderMcqQuestionsAction(
  assignmentId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireStaff();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(mcqQuestions)
      .set({ orderIndex: i })
      .where(
        and(
          eq(mcqQuestions.id, orderedIds[i]),
          eq(mcqQuestions.assignmentId, assignmentId),
        ),
      );
  }

  return { success: true };
}

// ─── MCQ Submission (auto-grade) ──────────────────────────────────────────────

export async function submitMcqAction(
  assignmentId: string,
  answers: Array<{ questionId: string; selectedOptionId: string }>,
): Promise<ActionResult<{ score: number; maxScore: number; correct: number; total: number }>> {
  const session = await requireAuth();

  // Load assignment
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) return { error: "Assignment not found" };
  if (assignment.format !== "mcq") return { error: "Not an MCQ assignment" };
  if (!assignment.isPublished) return { error: "Assignment is not available" };

  // Check deadline with grace period
  if (assignment.deadline) {
    const effectiveDeadline = new Date(assignment.deadline);
    effectiveDeadline.setHours(
      effectiveDeadline.getHours() + (assignment.gracePeriodHours ?? 0),
    );
    if (new Date() > effectiveDeadline && !assignment.allowResubmit) {
      return { error: "Submission deadline has passed" };
    }
  }

  // Check existing submission
  const [existingSubmission] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, session.user.id),
      ),
    )
    .limit(1);

  if (existingSubmission && !assignment.allowResubmit) {
    return { error: "You have already submitted this assignment" };
  }

  // Load all questions and correct options
  const questions = await db
    .select()
    .from(mcqQuestions)
    .where(eq(mcqQuestions.assignmentId, assignmentId));

  const allOptions = await db
    .select()
    .from(mcqOptions)
    .where(
      eq(
        mcqOptions.questionId,
        sql`ANY(SELECT id FROM mcq_questions WHERE assignment_id = ${assignmentId})`,
      ),
    );

  // Build answer map
  const correctOptionByQuestion = new Map(
    allOptions
      .filter((o) => o.isCorrect)
      .map((o) => [o.questionId, o.id]),
  );

  let earnedPoints = 0;
  let totalPoints = 0;
  const answerRecords: typeof mcqAnswers.$inferInsert[] = [];

  for (const q of questions) {
    const points = Number(q.points);
    totalPoints += points;

    const answer = answers.find((a) => a.questionId === q.id);
    const correctOptionId = correctOptionByQuestion.get(q.id);
    const isCorrect = answer?.selectedOptionId === correctOptionId;

    if (isCorrect) earnedPoints += points;

    answerRecords.push({
      submissionId: "", // filled after insert
      questionId: q.id,
      selectedOptionId: answer?.selectedOptionId ?? null,
      isCorrect,
    });
  }

  const score =
    totalPoints > 0
      ? (earnedPoints / totalPoints) * Number(assignment.maxScore)
      : 0;

  const roundedScore = Math.round(score * 100) / 100;
  const isLate = assignment.deadline ? new Date() > new Date(assignment.deadline) : false;

  // If resubmit, archive old submission
  if (existingSubmission) {
    await db.insert(submissionHistory).values({
      submissionId: existingSubmission.id,
      assignmentId,
      studentId: session.user.id,
      filePath: existingSubmission.filePath,
      textAnswer: existingSubmission.textAnswer,
      submittedAt: existingSubmission.submittedAt,
      version: existingSubmission.version,
    });

    await db
      .update(submissions)
      .set({
        submittedAt: new Date(),
        isLate,
        version: existingSubmission.version + 1,
        status: "submitted",
      })
      .where(eq(submissions.id, existingSubmission.id));

    // Delete old answers and grade
    await db
      .delete(mcqAnswers)
      .where(eq(mcqAnswers.submissionId, existingSubmission.id));
    await db
      .delete(grades)
      .where(eq(grades.submissionId, existingSubmission.id));

    // Insert new answers
    const updatedAnswers = answerRecords.map((a) => ({
      ...a,
      submissionId: existingSubmission.id,
    }));
    if (updatedAnswers.length > 0) {
      await db.insert(mcqAnswers).values(updatedAnswers);
    }

    // Auto-grade
    await db.insert(grades).values({
      submissionId: existingSubmission.id,
      score: String(roundedScore),
      gradedBy: session.user.id,
      gradedAt: new Date(),
      comment: "Auto-graded (MCQ)",
      status: "published",
      publishedAt: new Date(),
    });
  } else {
    // New submission
    const [submission] = await db
      .insert(submissions)
      .values({
        assignmentId,
        studentId: session.user.id,
        submittedAt: new Date(),
        isLate,
        version: 1,
        status: "submitted",
      })
      .returning({ id: submissions.id });

    const answersWithSubId = answerRecords.map((a) => ({
      ...a,
      submissionId: submission.id,
    }));
    if (answersWithSubId.length > 0) {
      await db.insert(mcqAnswers).values(answersWithSubId);
    }

    // Auto-grade
    await db.insert(grades).values({
      submissionId: submission.id,
      score: String(roundedScore),
      gradedBy: session.user.id,
      gradedAt: new Date(),
      comment: "Auto-graded (MCQ)",
      status: "published",
      publishedAt: new Date(),
    });
  }

  // Audit
  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: existingSubmission ? "submission_replaced" : "submission_created",
    entity: "submissions",
    entityId: assignmentId,
    newData: {
      assignmentId,
      score: roundedScore,
      isLate,
    } as unknown as Record<string, unknown>,
  });

  // Update module completion
  await recomputeModuleCompletion(session.user.id, assignment.moduleId);

  revalidatePath(`/lms/assignments/${assignmentId}`);

  return {
    success: true,
    data: {
      score: roundedScore,
      maxScore: Number(assignment.maxScore),
      correct: answerRecords.filter((a) => a.isCorrect).length,
      total: questions.length,
    },
  };
}

// ─── Essay / PDF Submission ───────────────────────────────────────────────────

export async function submitEssayAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ submissionId: string }>> {
  const session = await requireAuth();

  const parse = essaySubmitSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    textAnswer: formData.get("textAnswer") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { assignmentId, textAnswer } = parse.data;

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) return { error: "Assignment not found" };
  if (!assignment.isPublished) return { error: "Assignment is not available" };

  // Check deadline with grace period
  if (assignment.deadline) {
    const effectiveDeadline = new Date(assignment.deadline);
    effectiveDeadline.setHours(
      effectiveDeadline.getHours() + (assignment.gracePeriodHours ?? 0),
    );
    if (new Date() > effectiveDeadline) {
      return {
        error: assignment.gracePeriodHours > 0
          ? "Submission window (including grace period) has closed"
          : "Submission deadline has passed",
      };
    }
  }

  const [existingSubmission] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, session.user.id),
      ),
    )
    .limit(1);

  if (existingSubmission && !assignment.allowResubmit) {
    return { error: "You have already submitted this assignment" };
  }

  // File is uploaded separately via /api/upload; filePath is passed in formData.
  // If resubmitting without a new file, preserve the previously uploaded one.
  const uploadedFilePath = (formData.get("filePath") as string) || null;
  const effectiveFilePath =
    uploadedFilePath ?? (existingSubmission?.filePath ?? null);

  const isLate = assignment.deadline
    ? new Date() > new Date(assignment.deadline)
    : false;

  let submissionId: string;

  if (existingSubmission) {
    // Archive old
    await db.insert(submissionHistory).values({
      submissionId: existingSubmission.id,
      assignmentId,
      studentId: session.user.id,
      filePath: existingSubmission.filePath,
      textAnswer: existingSubmission.textAnswer,
      submittedAt: existingSubmission.submittedAt,
      version: existingSubmission.version,
    });

    await db
      .update(submissions)
      .set({
        filePath: effectiveFilePath,
        textAnswer: textAnswer ?? null,
        submittedAt: new Date(),
        isLate,
        version: existingSubmission.version + 1,
        status: "submitted",
      })
      .where(eq(submissions.id, existingSubmission.id));

    submissionId = existingSubmission.id;
  } else {
    const [sub] = await db
      .insert(submissions)
      .values({
        assignmentId,
        studentId: session.user.id,
        filePath: effectiveFilePath,
        textAnswer: textAnswer ?? null,
        submittedAt: new Date(),
        isLate,
        version: 1,
        status: "submitted",
      })
      .returning({ id: submissions.id });

    submissionId = sub.id;
  }

  // Audit
  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: existingSubmission ? "submission_replaced" : "submission_created",
    entity: "submissions",
    entityId: submissionId,
    newData: { assignmentId, filePath: effectiveFilePath, isLate } as unknown as Record<string, unknown>,
  });

  // Update module completion
  await recomputeModuleCompletion(session.user.id, assignment.moduleId);

  revalidatePath(`/lms/assignments/${assignmentId}`);

  return { success: true, data: { submissionId } };
}

// ─── Grading ──────────────────────────────────────────────────────────────────

export async function saveGradeAction(
  submissionId: string,
  score: number,
  comment: string,
  publish: boolean,
): Promise<ActionResult> {
  const session = await requireStaff();

  // Validate score against assignment maxScore
  const [sub] = await db
    .select({ assignmentId: submissions.assignmentId })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!sub) return { error: "Submission not found" };

  const [assignment] = await db
    .select({ maxScore: assignments.maxScore, moduleId: assignments.moduleId })
    .from(assignments)
    .where(eq(assignments.id, sub.assignmentId))
    .limit(1);

  if (!assignment) return { error: "Assignment not found" };

  if (score > Number(assignment.maxScore))
    return {
      error: `Score cannot exceed max score of ${assignment.maxScore}`,
    };
  if (score < 0) return { error: "Score cannot be negative" };

  const [existingGrade] = await db
    .select({ id: grades.id })
    .from(grades)
    .where(eq(grades.submissionId, submissionId))
    .limit(1);

  const status = publish ? "published" : "draft";

  if (existingGrade) {
    await db
      .update(grades)
      .set({
        score: String(score),
        gradedBy: session.user.id,
        gradedAt: new Date(),
        comment,
        status,
        publishedAt: publish ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(grades.submissionId, submissionId));

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: publish ? "grade_published" : "grade_drafted",
      entity: "grades",
      entityId: existingGrade.id,
      newData: { score, comment, status } as unknown as Record<string, unknown>,
    });
  } else {
    const [newGrade] = await db
      .insert(grades)
      .values({
        submissionId,
        score: String(score),
        gradedBy: session.user.id,
        gradedAt: new Date(),
        comment,
        status,
        publishedAt: publish ? new Date() : undefined,
      })
      .returning({ id: grades.id });

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: publish ? "grade_published" : "grade_drafted",
      entity: "grades",
      entityId: newGrade.id,
      newData: { score, comment, status } as unknown as Record<string, unknown>,
    });
  }

  revalidatePath(`/lms/grading`);
  return { success: true };
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

const feedbackSchema = z.object({
  offeringId: z.string().uuid(),
  moduleId: z.string().uuid(),
  type: z.enum(["assistant", "session", "laboratory"]),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  assistantId: z.string().uuid().optional(),
});

export async function submitFeedbackAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAuth();

  if (session.user.role !== "student")
    return { error: "Only students can submit feedback" };

  const parse = feedbackSchema.safeParse({
    offeringId: formData.get("offeringId"),
    moduleId: formData.get("moduleId"),
    type: formData.get("type"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
    assistantId: formData.get("assistantId") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { offeringId, moduleId, type, rating, comment, assistantId } = parse.data;

  // Check if feedback already submitted for this type + module
  const [existing] = await db
    .select({ id: feedbackEntries.id })
    .from(feedbackEntries)
    .where(
      and(
        eq(feedbackEntries.studentId, session.user.id),
        eq(feedbackEntries.moduleId, moduleId),
        eq(feedbackEntries.type, type),
      ),
    )
    .limit(1);

  if (existing) return { error: "You have already submitted this feedback" };

  // Verify required assignments are submitted before unlocking feedback
  const moduleAssignments = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(eq(assignments.moduleId, moduleId), eq(assignments.isRequired, true)),
    );

  for (const a of moduleAssignments) {
    const [sub] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, a.id),
          eq(submissions.studentId, session.user.id),
        ),
      )
      .limit(1);

    if (!sub) {
      return {
        error:
          "You must submit all required assignments before submitting feedback",
      };
    }
  }

  await db.insert(feedbackEntries).values({
    studentId: session.user.id,
    offeringId,
    moduleId,
    assistantId: assistantId ?? null,
    type,
    rating,
    comment: comment ?? null,
  });

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "feedback_submitted",
    entity: "feedback_entries",
    entityId: moduleId,
    newData: { type, rating, moduleId } as unknown as Record<string, unknown>,
  });

  // Recompute module completion
  await recomputeModuleCompletion(session.user.id, moduleId);

  revalidatePath(`/lms/feedback`);
  return { success: true };
}

// ─── Module Completion ────────────────────────────────────────────────────────

export async function recomputeModuleCompletion(
  studentId: string,
  moduleId: string,
): Promise<void> {
  // 1. Check all required assignments are submitted
  const requiredAssignments = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(eq(assignments.moduleId, moduleId), eq(assignments.isRequired, true)),
    );

  for (const a of requiredAssignments) {
    const [sub] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, a.id),
          eq(submissions.studentId, studentId),
        ),
      )
      .limit(1);

    if (!sub) {
      await setModuleCompletion(studentId, moduleId, false);
      return;
    }
  }

  // 2. Check all 3 feedback types submitted
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

    if (!fb) {
      await setModuleCompletion(studentId, moduleId, false);
      return;
    }
  }

  // All conditions met
  await setModuleCompletion(studentId, moduleId, true);
}

async function setModuleCompletion(
  studentId: string,
  moduleId: string,
  isComplete: boolean,
): Promise<void> {
  const [existing] = await db
    .select({ id: moduleCompletions.id })
    .from(moduleCompletions)
    .where(
      and(
        eq(moduleCompletions.studentId, studentId),
        eq(moduleCompletions.moduleId, moduleId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(moduleCompletions)
      .set({
        isComplete,
        completedAt: isComplete ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(moduleCompletions.id, existing.id));
  } else {
    await db.insert(moduleCompletions).values({
      studentId,
      moduleId,
      isComplete,
      completedAt: isComplete ? new Date() : null,
    });
  }
}
