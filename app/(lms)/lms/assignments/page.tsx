import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getActiveOfferingsForStudentAction } from "@/lib/actions/courses";
import { db } from "@/lib/db";
import {
  modules,
  assignments,
  submissions,
  grades,
} from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { AssignmentList } from "./AssignmentList";

export const metadata = { title: "Tugas Saya" };

export type AssignmentItem = {
  assignmentId: string;
  title: string;
  type: string;
  format: string;
  deadline: string | null;
  isRequired: boolean;
  moduleId: string;
  moduleTitle: string;
  offeringId: string;
  courseName: string;
  courseCode: string;
  submittedAt: string | null;
  isLate: boolean;
  score: string | null;
  gradeStatus: string | null;
};

export default async function AssignmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const offerings = await getActiveOfferingsForStudentAction(session.user.id);

  const allAssignments: AssignmentItem[] = [];

  for (const { offering, course } of offerings) {
    const moduleRows = await db
      .select({ id: modules.id, title: modules.title })
      .from(modules)
      .where(eq(modules.offeringId, offering.id))
      .orderBy(asc(modules.orderIndex));

    if (moduleRows.length === 0) continue;

    const moduleIds = moduleRows.map((m) => m.id);
    const moduleTitleMap = new Map(moduleRows.map((m) => [m.id, m.title]));

    const assignmentRows = await db
      .select()
      .from(assignments)
      .where(
        and(
          inArray(assignments.moduleId, moduleIds),
          eq(assignments.isPublished, true),
        ),
      )
      .orderBy(asc(assignments.deadline));

    if (assignmentRows.length === 0) continue;

    const assignmentIds = assignmentRows.map((a) => a.id);

    const submissionRows = await db
      .select()
      .from(submissions)
      .where(
        and(
          inArray(submissions.assignmentId, assignmentIds),
          eq(submissions.studentId, session.user.id),
        ),
      );

    const submissionByAssignment = new Map(
      submissionRows.map((s) => [s.assignmentId, s]),
    );

    const submissionIds = submissionRows.map((s) => s.id);
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

    for (const a of assignmentRows) {
      const sub = submissionByAssignment.get(a.id);
      const grade = sub ? gradeBySubmission.get(sub.id) : undefined;

      allAssignments.push({
        assignmentId: a.id,
        title: a.title,
        type: a.type,
        format: a.format,
        deadline: a.deadline ? a.deadline.toISOString() : null,
        isRequired: a.isRequired,
        moduleId: a.moduleId,
        moduleTitle: moduleTitleMap.get(a.moduleId) ?? "—",
        offeringId: offering.id,
        courseName: course.name,
        courseCode: course.code,
        submittedAt: sub ? sub.submittedAt.toISOString() : null,
        isLate: sub?.isLate ?? false,
        score: grade?.score ?? null,
        gradeStatus: grade?.status ?? null,
      });
    }
  }

  // Summary counts
  const totalAssignments = allAssignments.length;
  const submitted = allAssignments.filter((a) => a.submittedAt !== null).length;
  const graded = allAssignments.filter((a) => a.score !== null).length;
  const notSubmitted = allAssignments.filter((a) => a.submittedAt === null).length;

  // Upcoming urgent deadlines (< 24h from now, not submitted)
  const now = new Date();
  const urgentCount = allAssignments.filter((a) => {
    if (a.submittedAt || !a.deadline) return false;
    const diff = new Date(a.deadline).getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tugas Saya
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua tugas dari mata kuliah yang Anda ikuti.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Tugas",
            value: totalAssignments,
            sub: "Semua mata kuliah",
            accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            label: "Belum Dikumpul",
            value: notSubmitted,
            sub: "Perlu segera dikerjakan",
            accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
          {
            label: "Dikumpulkan",
            value: submitted,
            sub: "Sudah dikumpulkan",
            accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          },
          {
            label: "Mendesak",
            value: urgentCount,
            sub: "Deadline < 24 jam",
            accent:
              urgentCount > 0
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-muted text-muted-foreground",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${stat.accent}`}
            >
              <span>{stat.value}</span>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment list */}
      {allAssignments.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada tugas yang tersedia.
          </p>
        </div>
      ) : (
        <AssignmentList items={allAssignments} />
      )}
    </div>
  );
}
