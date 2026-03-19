import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  enrollments,
  courseOfferings,
  courses,
  attendanceRecords,
  modules,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import Link from "next/link";
import {
  UserCheck,
  UserX,
  Clock,
  Calendar,
  BookOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Attendance — EvConn LMS" };

type AttendanceStatus = "present" | "absent" | "excused" | "late";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  present: {
    label: "Present",
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  late: {
    label: "Late",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  absent: {
    label: "Absent",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  excused: {
    label: "Excused",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ offeringId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Staff see per-module attendance in the offerings area
  if (
    session.user.role === "assistant" ||
    session.user.role === "super_admin"
  ) {
    redirect("/lms/offerings");
  }

  const { offeringId: selectedOfferingId } = await searchParams;
  const studentId = session.user.id;

  // ── Fetch all enrollments for this student ────────────────────────────────
  const studentEnrollments = await db
    .select({
      offeringId: enrollments.offeringId,
      courseName: courses.name,
      courseCode: courses.code,
      semester: courseOfferings.semester,
      academicYear: courseOfferings.academicYear,
      hari: courseOfferings.hari,
      shift: courseOfferings.shift,
    })
    .from(enrollments)
    .innerJoin(courseOfferings, eq(enrollments.offeringId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(asc(courseOfferings.semester));

  const activeOfferingId =
    selectedOfferingId ?? studentEnrollments[0]?.offeringId ?? null;

  // ── Fetch attendance records for the active offering ─────────────────────
  type RecordRow = {
    moduleId: string;
    status: AttendanceStatus;
    sessionDate: Date;
    notes: string | null;
    moduleTitle: string;
    moduleOrder: number;
  };

  let records: RecordRow[] = [];

  if (activeOfferingId) {
    records = (await db
      .select({
        moduleId: attendanceRecords.moduleId,
        status: attendanceRecords.status,
        sessionDate: attendanceRecords.sessionDate,
        notes: attendanceRecords.notes,
        moduleTitle: modules.title,
        moduleOrder: modules.orderIndex,
      })
      .from(attendanceRecords)
      .innerJoin(modules, eq(attendanceRecords.moduleId, modules.id))
      .where(
        and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.offeringId, activeOfferingId),
        ),
      )
      .orderBy(asc(modules.orderIndex))) as RecordRow[];
  }

  // ── Compute summary ───────────────────────────────────────────────────────
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const attendanceRate =
    total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const activeEnrollment = studentEnrollments.find(
    (e) => e.offeringId === activeOfferingId,
  );

  const progressColor =
    attendanceRate >= 80
      ? "bg-green-500"
      : attendanceRate >= 60
        ? "bg-amber-500"
        : total > 0
          ? "bg-red-500"
          : "bg-muted";

  const rateTextColor =
    attendanceRate >= 80
      ? "text-green-600 dark:text-green-400"
      : attendanceRate >= 60
        ? "text-amber-600 dark:text-amber-400"
        : total > 0
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground";

  const rateMessage =
    total === 0
      ? "No sessions recorded yet."
      : attendanceRate >= 80
        ? "Good attendance — keep it up!"
        : attendanceRate >= 60
          ? "Attendance needs improvement."
          : "Attention: attendance below minimum threshold (60%).";

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Attendance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your attendance in every practicum session.
        </p>
      </div>

      {/* ── Offering filter tabs ──────────────────────────────────────────── */}
      {studentEnrollments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">
            No courses yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You are not enrolled in any courses.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {studentEnrollments.map((enrollment) => {
              const isActive = enrollment.offeringId === activeOfferingId;
              const label = [
                enrollment.courseCode,
                enrollment.semester,
                enrollment.hari,
                enrollment.shift,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={enrollment.offeringId}
                  href={`/lms/attendance?offeringId=${enrollment.offeringId}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Active offering detail ─────────────────────────────────── */}
          {activeEnrollment && (
            <div className="space-y-6">
              {/* Rate card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {activeEnrollment.courseName}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {activeEnrollment.courseCode} &bull;{" "}
                      {activeEnrollment.semester}{" "}
                      {activeEnrollment.academicYear}
                      {activeEnrollment.hari && ` · ${activeEnrollment.hari}`}
                      {activeEnrollment.shift && ` · ${activeEnrollment.shift}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-3xl font-bold tabular-nums",
                      rateTextColor,
                    )}
                  >
                    {attendanceRate}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Attendance Rate
                    </span>
                    <span className="font-medium text-foreground">
                      {present + late}/{total} sessions counted
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        progressColor,
                      )}
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{rateMessage}</p>
                </div>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(
                  [
                    {
                      label: "Total Sessions",
                      value: total,
                      icon: Calendar,
                      accent:
                        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    },
                    {
                      label: "Present",
                      value: present,
                      icon: UserCheck,
                      accent:
                        "bg-teal-500/10 text-teal-600 dark:text-teal-400",
                    },
                    {
                      label: "Late",
                      value: late,
                      icon: Clock,
                      accent:
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    },
                    {
                      label: "Absent",
                      value: absent,
                      icon: UserX,
                      accent: "bg-red-500/10 text-red-600 dark:text-red-400",
                    },
                    {
                      label: "Excused",
                      value: excused,
                      icon: FileText,
                      accent:
                        "bg-gray-500/10 text-gray-600 dark:text-gray-400",
                    },
                  ] as const
                ).map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl",
                          stat.accent,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Per-module attendance table */}
              <div>
                <h2 className="mb-3 text-base font-semibold text-foreground">
                  Attendance History per Module
                </h2>

                {records.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-foreground">
                      No attendance data yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Attendance data will appear after the assistant records
                      the session attendance.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    {/* Header row — hidden on mobile */}
                    <div className="hidden border-b border-border bg-muted/30 px-5 py-3 sm:grid sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-4">
                      <span className="text-xs font-medium text-muted-foreground">
                        #
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Module
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Session Date
                      </span>
                      <span className="text-right text-xs font-medium text-muted-foreground">
                        Status
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {records.map((record) => {
                        const cfg = STATUS_CONFIG[record.status];
                        return (
                          <div
                            key={record.moduleId}
                            className="flex flex-col gap-2 p-4 sm:grid sm:grid-cols-[3rem_1fr_auto_auto] sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
                          >
                            {/* Order index */}
                            <span className="hidden w-12 text-sm font-medium tabular-nums text-muted-foreground sm:block">
                              {record.moduleOrder}
                            </span>

                            {/* Module title + optional notes */}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {/* Show order on mobile inline */}
                                <span className="mr-1.5 text-xs text-muted-foreground sm:hidden">
                                  [{record.moduleOrder}]
                                </span>
                                {record.moduleTitle}
                              </p>
                              {record.notes && (
                                <p className="mt-0.5 text-xs italic text-muted-foreground">
                                  {record.notes}
                                </p>
                              )}
                            </div>

                            {/* Session date */}
                            <span className="text-xs text-muted-foreground">
                              {new Date(record.sessionDate).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>

                            {/* Status badge */}
                            <span
                              className={cn(
                                "self-start rounded-full px-2.5 py-0.5 text-xs font-medium sm:self-auto sm:text-right",
                                cfg.className,
                              )}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
