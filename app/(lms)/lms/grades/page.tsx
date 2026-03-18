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
import { GradeTable } from "./GradeTable";

export const metadata = { title: "Nilai Saya" };

export type GradeRow = {
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: string;
  maxScore: string;
  moduleTitle: string;
  moduleId: string;
  submittedAt: string | null;
  isLate: boolean;
  score: string | null;
  gradeStatus: string | null;
  gradeComment: string | null;
};

export type CourseGrades = {
  offeringId: string;
  courseName: string;
  courseCode: string;
  semester: string;
  academicYear: string;
  rows: GradeRow[];
};

export default async function GradesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const offerings = await getActiveOfferingsForStudentAction(session.user.id);

  const courseGrades: CourseGrades[] = await Promise.all(
    offerings.map(async ({ offering, course }) => {
      // Get all published assignments for this offering
      const moduleRows = await db
        .select({ id: modules.id, title: modules.title })
        .from(modules)
        .where(eq(modules.offeringId, offering.id))
        .orderBy(asc(modules.orderIndex));

      if (moduleRows.length === 0) {
        return {
          offeringId: offering.id,
          courseName: course.name,
          courseCode: course.code,
          semester: offering.semester,
          academicYear: offering.academicYear,
          rows: [],
        };
      }

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
        .orderBy(asc(assignments.orderIndex));

      if (assignmentRows.length === 0) {
        return {
          offeringId: offering.id,
          courseName: course.name,
          courseCode: course.code,
          semester: offering.semester,
          academicYear: offering.academicYear,
          rows: [],
        };
      }

      const assignmentIds = assignmentRows.map((a) => a.id);

      // Fetch student's submissions for these assignments
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

      // Fetch published grades
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

      const gradeBySubmission = new Map(
        gradeRows.map((g) => [g.submissionId, g]),
      );

      const rows: GradeRow[] = assignmentRows.map((a) => {
        const sub = submissionByAssignment.get(a.id);
        const grade = sub ? gradeBySubmission.get(sub.id) : undefined;

        return {
          assignmentId: a.id,
          assignmentTitle: a.title,
          assignmentType: a.type,
          maxScore: a.maxScore,
          moduleTitle: moduleTitleMap.get(a.moduleId) ?? "—",
          moduleId: a.moduleId,
          submittedAt: sub ? sub.submittedAt.toISOString() : null,
          isLate: sub?.isLate ?? false,
          score: grade?.score ?? null,
          gradeStatus: grade?.status ?? null,
          gradeComment: grade?.comment ?? null,
        };
      });

      return {
        offeringId: offering.id,
        courseName: course.name,
        courseCode: course.code,
        semester: offering.semester,
        academicYear: offering.academicYear,
        rows,
      };
    }),
  );

  // Summary stats
  const allRows = courseGrades.flatMap((cg) => cg.rows);
  const totalAssignments = allRows.length;
  const totalGraded = allRows.filter((r) => r.score !== null).length;
  const totalSubmitted = allRows.filter((r) => r.submittedAt !== null).length;
  const totalPending = totalSubmitted - totalGraded;

  const scores = allRows
    .filter((r) => r.score !== null)
    .map((r) => Number(r.score));
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10
      : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nilai Saya
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rekap nilai tugas dari semua mata kuliah yang Anda ikuti.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Rata-rata Nilai",
            value: avgScore !== null ? avgScore.toFixed(1) : "—",
            sub: "Dari tugas yang sudah dinilai",
            accent: "bg-green-500/10 text-green-600 dark:text-green-400",
          },
          {
            label: "Sudah Dinilai",
            value: totalGraded,
            sub: `dari ${totalSubmitted} dikumpulkan`,
            accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          },
          {
            label: "Menunggu Penilaian",
            value: totalPending,
            sub: "Submitted, belum dinilai",
            accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
          {
            label: "Total Tugas",
            value: totalAssignments,
            sub: "Semua mata kuliah",
            accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${stat.accent}`}
            >
              {typeof stat.value === "number" && stat.value > 99 ? "99+" : stat.value}
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

      {/* Grade tables per course */}
      {courseGrades.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada mata kuliah aktif.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {courseGrades.map((cg) => (
            <section key={cg.offeringId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {cg.courseName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {cg.courseCode} &bull; {cg.semester} {cg.academicYear}
                  </p>
                </div>
                <Link
                  href={`/lms/courses/${cg.offeringId}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lihat Modul
                </Link>
              </div>
              <GradeTable rows={cg.rows} offeringId={cg.offeringId} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
