import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getModuleByIdAction, getContentItemsByModuleAction } from "@/lib/actions/modules";
import { db } from "@/lib/db";
import {
  courseOfferings,
  courses,
  assignments,
  mcqQuestions,
  mcqOptions,
  submissions,
  enrollments,
  groupSubmissions,
  grades,
  feedbackEntries,
  moduleCompletions,
} from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { ContentList } from "./ContentList";
import { FeedbackSection } from "./FeedbackSection";

export const metadata = { title: "Modul" };

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: moduleId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch the module
  const module = await getModuleByIdAction(moduleId);
  if (!module) notFound();

  // Fetch offering + course for breadcrumb
  const [offeringRow] = await db
    .select({ offering: courseOfferings, course: courses })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(courseOfferings.id, module.offeringId))
    .limit(1);

  // Fetch published content items for this module
  const contentItems = await getContentItemsByModuleAction(moduleId);

  // Gather all assignment IDs referenced in content items
  const assignmentIds: string[] = [];
  for (const item of contentItems) {
    if (item.type === "assignment_reference") {
      try {
        const data = JSON.parse(item.contentData) as { assignmentId?: string };
        if (data.assignmentId) assignmentIds.push(data.assignmentId);
      } catch {
        // skip malformed contentData
      }
    }
  }

  // Fetch all referenced assignments (published only for students)
  const isStaff =
    session.user.role === "assistant" || session.user.role === "super_admin";

  let assignmentRows: (typeof assignments.$inferSelect)[] = [];
  if (assignmentIds.length > 0) {
    assignmentRows = await db
      .select()
      .from(assignments)
      .where(
        isStaff
          ? inArray(assignments.id, assignmentIds)
          : and(
              inArray(assignments.id, assignmentIds),
              eq(assignments.isPublished, true),
            ),
      )
      .orderBy(asc(assignments.orderIndex));
  }

  // Fetch MCQ questions + options (strip isCorrect for students)
  const questionsByAssignment = new Map<
    string,
    Array<{
      id: string;
      questionText: string;
      orderIndex: number;
      points: string;
      options: Array<{ id: string; optionText: string; orderIndex: number }>;
    }>
  >();

  const mcqAssignmentIds = assignmentRows
    .filter((a) => a.format === "mcq")
    .map((a) => a.id);

  if (mcqAssignmentIds.length > 0) {
    const questions = await db
      .select()
      .from(mcqQuestions)
      .where(inArray(mcqQuestions.assignmentId, mcqAssignmentIds))
      .orderBy(asc(mcqQuestions.orderIndex));

    const questionIds = questions.map((q) => q.id);
    const options =
      questionIds.length > 0
        ? await db
            .select()
            .from(mcqOptions)
            .where(inArray(mcqOptions.questionId, questionIds))
            .orderBy(asc(mcqOptions.orderIndex))
        : [];

    // Group questions by assignment, attach options (no isCorrect for students)
    for (const q of questions) {
      const qOptions = options
        .filter((o) => o.questionId === q.id)
        .map(({ id, optionText, orderIndex }) => ({ id, optionText, orderIndex }));

      const existing = questionsByAssignment.get(q.assignmentId) ?? [];
      existing.push({
        id: q.id,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        points: q.points,
        options: qOptions,
      });
      questionsByAssignment.set(q.assignmentId, existing);
    }
  }

  // Fetch student submissions for all assignments in this module
  const [enrollmentRow] = await db
    .select({ groupId: enrollments.groupId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.offeringId, module.offeringId),
        eq(enrollments.studentId, session.user.id),
      ),
    )
    .limit(1);

  const studentGroupId = enrollmentRow?.groupId ?? null;

  const individualSubmissionRows =
    assignmentIds.length > 0
      ? await db
          .select()
          .from(submissions)
          .where(
            and(
              inArray(submissions.assignmentId, assignmentIds),
              eq(submissions.studentId, session.user.id),
            ),
          )
      : [];

  const groupSubmissionRows =
    studentGroupId && assignmentIds.length > 0
      ? await db
          .select()
          .from(groupSubmissions)
          .where(
            and(
              inArray(groupSubmissions.assignmentId, assignmentIds),
              eq(groupSubmissions.groupId, studentGroupId),
            ),
          )
      : [];

  const individualSubmissionByAssignment = new Map(
    individualSubmissionRows.map((s) => [s.assignmentId, s]),
  );
  const groupSubmissionByAssignment = new Map(
    groupSubmissionRows.map((s) => [s.assignmentId, s]),
  );

  const submissionByAssignment = new Map<
    string,
    {
      id: string;
      status: string;
      submittedAt: string;
      textAnswer: string | null;
      filePath: string | null;
      isLate: boolean;
      version: number;
    }
  >();

  for (const asgn of assignmentRows) {
    const useGroupSubmission =
      asgn.isGroupAssignment || asgn.type === "study_group_task";

    if (useGroupSubmission) {
      const sub = groupSubmissionByAssignment.get(asgn.id);
      if (sub) {
        submissionByAssignment.set(asgn.id, {
          id: sub.id,
          status: "submitted",
          submittedAt: sub.submittedAt.toISOString(),
          textAnswer: sub.textAnswer,
          filePath: sub.filePath,
          isLate: sub.isLate,
          version: sub.version,
        });
      }
      continue;
    }

    const sub = individualSubmissionByAssignment.get(asgn.id);
    if (sub) {
      submissionByAssignment.set(asgn.id, {
        id: sub.id,
        status: sub.status,
        submittedAt: sub.submittedAt.toISOString(),
        textAnswer: sub.textAnswer,
        filePath: sub.filePath,
        isLate: sub.isLate,
        version: sub.version,
      });
    }
  }

  // Fetch grades for those submissions
  const submissionIds = individualSubmissionRows.map((s) => s.id);
  const gradeRows =
    submissionIds.length > 0
      ? await db
          .select()
          .from(grades)
          .where(
            and(
              inArray(grades.submissionId, submissionIds),
              eq(grades.status, "published"),
            ),
          )
      : [];

  const gradeBySubmission = new Map(gradeRows.map((g) => [g.submissionId, g]));

  // Check if all required assignments are submitted (to unlock feedback)
  const requiredAssignments = assignmentRows.filter(
    (a) => a.isRequired && a.isPublished,
  );
  const allRequiredSubmitted = requiredAssignments.every(
    (a) => submissionByAssignment.has(a.id),
  );

  // Fetch existing feedback for this student + module
  const existingFeedback = await db
    .select({ type: feedbackEntries.type })
    .from(feedbackEntries)
    .where(
      and(
        eq(feedbackEntries.studentId, session.user.id),
        eq(feedbackEntries.moduleId, moduleId),
      ),
    );
  const submittedFeedbackTypes = existingFeedback.map((f) => f.type);

  // Fetch module completion status
  const [completionRow] = await db
    .select({ isComplete: moduleCompletions.isComplete })
    .from(moduleCompletions)
    .where(
      and(
        eq(moduleCompletions.moduleId, moduleId),
        eq(moduleCompletions.studentId, session.user.id),
      ),
    )
    .limit(1);

  const isModuleComplete = completionRow?.isComplete ?? false;

  // Build serialized content items with enriched assignment data
  type SerializedContentItem = {
    id: string;
    type: string;
    title: string;
    contentData: string;
    orderIndex: number;
    isPublished: boolean;
    assignment?: {
      id: string;
      title: string;
      description: string | null;
      type: string;
      format: string;
      maxScore: string;
      deadline: string | null;
      allowResubmit: boolean;
      isRequired: boolean;
      gracePeriodHours: number;
      groupId?: string | null;
      questions?: Array<{
        id: string;
        questionText: string;
        orderIndex: number;
        points: string;
        options: Array<{ id: string; optionText: string; orderIndex: number }>;
      }>;
      submission?: {
        id: string;
        status: string;
        submittedAt: string;
        textAnswer: string | null;
        filePath: string | null;
        isLate: boolean;
        version: number;
      } | null;
      grade?: {
        score: string;
        comment: string | null;
        gradedAt: string;
      } | null;
    };
  };

  const serializedItems: SerializedContentItem[] = contentItems.map((item) => {
    if (item.type !== "assignment_reference") {
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        contentData: item.contentData,
        orderIndex: item.orderIndex,
        isPublished: item.isPublished,
      };
    }

    // Enrich assignment_reference items
    let assignmentId: string | undefined;
    try {
      const data = JSON.parse(item.contentData) as { assignmentId?: string };
      assignmentId = data.assignmentId;
    } catch {
      // malformed
    }

    const asgn = assignmentId
      ? assignmentRows.find((a) => a.id === assignmentId)
      : undefined;

    if (!asgn) {
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        contentData: item.contentData,
        orderIndex: item.orderIndex,
        isPublished: item.isPublished,
      };
    }

    const sub = submissionByAssignment.get(asgn.id);
    const grade = sub ? gradeBySubmission.get(sub.id) : undefined;

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      contentData: item.contentData,
      orderIndex: item.orderIndex,
      isPublished: item.isPublished,
      assignment: {
        id: asgn.id,
        title: asgn.title,
        description: asgn.description,
        type: asgn.type,
        format: asgn.format,
        maxScore: asgn.maxScore,
        deadline: asgn.deadline ? asgn.deadline.toISOString() : null,
        allowResubmit: asgn.allowResubmit,
        isRequired: asgn.isRequired,
        gracePeriodHours: asgn.gracePeriodHours,
          groupId: studentGroupId,
        questions: questionsByAssignment.get(asgn.id),
        submission: sub
          ? {
              id: sub.id,
              status: sub.status,
            submittedAt: sub.submittedAt,
              textAnswer: sub.textAnswer,
              filePath: sub.filePath,
              isLate: sub.isLate,
              version: sub.version,
            }
          : null,
        grade: grade
          ? {
              score: grade.score,
              comment: grade.comment,
              gradedAt: grade.gradedAt.toISOString(),
            }
          : null,
      },
    };
  });

  const courseName = offeringRow?.course.name ?? "Mata Kuliah";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/lms/courses" className="hover:text-foreground transition-colors">
          Mata Kuliah
        </Link>
        <span>/</span>
        <Link
          href={`/lms/courses/${module.offeringId}`}
          className="hover:text-foreground transition-colors"
        >
          {courseName}
        </Link>
        <span>/</span>
        <span className="text-foreground">Modul {module.orderIndex + 1}</span>
      </nav>

      {/* Module header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {/* Hex-style module number badge */}
          <div
            className={
              isModuleComplete
                ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400"
                : module.status === "open"
                  ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
            }
          >
            <span className="text-xl font-bold">{module.orderIndex + 1}</span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  module.status === "open"
                    ? "inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400"
                    : module.status === "scheduled"
                      ? "inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400"
                      : module.status === "closed"
                        ? "inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400"
                        : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                }
              >
                {module.status === "open"
                  ? "Dibuka"
                  : module.status === "scheduled"
                    ? "Terjadwal"
                    : module.status === "closed"
                      ? "Ditutup"
                      : "Draft"}
              </span>
              {isModuleComplete && (
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                  Selesai
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {module.title}
            </h1>
            {module.description && (
              <p className="text-sm text-muted-foreground">{module.description}</p>
            )}
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
              {module.openDatetime && (
                <span>
                  Buka:{" "}
                  {new Date(module.openDatetime).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {module.closeDatetime && (
                <span>
                  Tutup:{" "}
                  {new Date(module.closeDatetime).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content items */}
      {serializedItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada konten untuk modul ini.
          </p>
        </div>
      ) : (
        <ContentList items={serializedItems} />
      )}

      {/* Feedback section — shown only when all required assignments are submitted */}
      {session.user.role === "student" && (
        <FeedbackSection
          moduleId={moduleId}
          offeringId={module.offeringId}
          allRequiredSubmitted={allRequiredSubmitted}
          submittedFeedbackTypes={submittedFeedbackTypes}
        />
      )}
    </div>
  );
}
