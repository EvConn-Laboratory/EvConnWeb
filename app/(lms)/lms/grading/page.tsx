import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  submissions,
  assignments,
  modules,
  courseOfferings,
  courses,
  users,
  grades,
  offeringAssistants,
} from "@/lib/db/schema";
import { eq, and, asc, inArray, isNull, desc } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { GradingInterface } from "./_components/GradingInterface";

export const metadata: Metadata = { title: "Grading Queue" };

type SearchParams = { offeringId?: string };

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    redirect("/lms/dashboard");
  }

  // Get all offerings this assistant is assigned to
  const assignedOfferings = await db
    .select({
      offeringId: courseOfferings.id,
      semester: courseOfferings.semester,
      academicYear: courseOfferings.academicYear,
      status: courseOfferings.status,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(offeringAssistants)
    .innerJoin(courseOfferings, eq(offeringAssistants.offeringId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(offeringAssistants.assistantId, session.user.id))
    .orderBy(desc(courseOfferings.createdAt));

  const { offeringId: rawId } = await searchParams;
  const activeOfferingId = rawId ?? assignedOfferings[0]?.offeringId ?? null;

  let submissionRows: {
    submissionId: string;
    studentName: string;
    studentNim: string | null;
    assignmentTitle: string;
    assignmentType: string;
    assignmentFormat: string;
    maxScore: string;
    moduleTitle: string;
    submittedAt: string;
    isLate: boolean;
    textAnswer: string | null;
    filePath: string | null;
    gradeId: string | null;
    score: string | null;
    comment: string | null;
    gradeStatus: string | null;
  }[] = [];

  if (activeOfferingId) {
    // Get all modules for this offering
    const moduleRows = await db
      .select({ id: modules.id, title: modules.title, orderIndex: modules.orderIndex })
      .from(modules)
      .where(eq(modules.offeringId, activeOfferingId))
      .orderBy(asc(modules.orderIndex));

    if (moduleRows.length > 0) {
      const moduleIds = moduleRows.map((m) => m.id);

      // Get essay_pdf assignments only (MCQ is auto-graded)
      const assignmentRows = await db
        .select()
        .from(assignments)
        .where(
          and(
            inArray(assignments.moduleId, moduleIds),
            eq(assignments.format, "essay_pdf"),
            eq(assignments.isPublished, true),
          ),
        )
        .orderBy(asc(assignments.orderIndex));

      if (assignmentRows.length > 0) {
        const assignmentIds = assignmentRows.map((a) => a.id);

        // Get all individual submissions for these assignments
        const subRows = await db
          .select({
            id: submissions.id,
            studentId: submissions.studentId,
            assignmentId: submissions.assignmentId,
            submittedAt: submissions.submittedAt,
            isLate: submissions.isLate,
            textAnswer: submissions.textAnswer,
            filePath: submissions.filePath,
          })
          .from(submissions)
          .where(inArray(submissions.assignmentId, assignmentIds))
          .orderBy(asc(submissions.submittedAt));

        if (subRows.length > 0) {
          const submissionIds = subRows.map((s) => s.id);
          const studentIds = [...new Set(subRows.map((s) => s.studentId))];

          // Fetch student info
          const studentRows = await db
            .select({ id: users.id, name: users.name, nim: users.nim })
            .from(users)
            .where(inArray(users.id, studentIds));
          const studentMap = new Map(studentRows.map((u) => [u.id, u]));

          // Fetch grades (all statuses)
          const gradeRows = await db
            .select()
            .from(grades)
            .where(inArray(grades.submissionId, submissionIds));
          const gradeMap = new Map(gradeRows.map((g) => [g.submissionId, g]));

          // Build assignment lookup
          const assignmentMap = new Map(assignmentRows.map((a) => [a.id, a]));
          const moduleTitleMap = new Map(moduleRows.map((m) => [m.id, m.title]));

          submissionRows = subRows.map((sub) => {
            const asgn = assignmentMap.get(sub.assignmentId)!;
            const student = studentMap.get(sub.studentId);
            const grade = gradeMap.get(sub.id);

            return {
              submissionId: sub.id,
              studentName: student?.name ?? "Unknown",
              studentNim: student?.nim ?? null,
              assignmentTitle: asgn.title,
              assignmentType: asgn.type,
              assignmentFormat: asgn.format,
              maxScore: asgn.maxScore,
              moduleTitle: moduleTitleMap.get(asgn.moduleId) ?? "—",
              submittedAt: sub.submittedAt.toISOString(),
              isLate: sub.isLate,
              textAnswer: sub.textAnswer,
              filePath: sub.filePath,
              gradeId: grade?.id ?? null,
              score: grade?.score ?? null,
              comment: grade?.comment ?? null,
              gradeStatus: grade?.status ?? null,
            };
          });
        }
      }
    }
  }

  const ungradedCount = submissionRows.filter(
    (s) => !s.gradeId || s.gradeStatus === "draft",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Grading Queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nilai tugas essay & PDF mahasiswa.{" "}
          {ungradedCount > 0 && (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {ungradedCount} belum dinilai.
            </span>
          )}
        </p>
      </div>

      {/* Offering selector */}
      {assignedOfferings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignedOfferings.map(({ offeringId, courseName, courseCode, semester, academicYear }) => {
            const isActive = offeringId === activeOfferingId;
            return (
              <Link
                key={offeringId}
                href={`/lms/grading?offeringId=${offeringId}`}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {courseCode} · {semester} {academicYear}
              </Link>
            );
          })}
        </div>
      )}

      {assignedOfferings.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Anda belum ditugaskan ke offering manapun.
          </p>
        </div>
      ) : (
        <GradingInterface submissions={submissionRows} />
      )}
    </div>
  );
}
