import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  enrollments,
  courseOfferings,
  courses,
  modules,
  attendanceRecords,
  users,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { AttendanceForm } from "./AttendanceForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catat Kehadiran — EvConn LMS" };

export default async function ModuleAttendancePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Only staff (assistant / super_admin) may access this page
  if (session.user.role === "student") {
    redirect("/lms/dashboard");
  }

  const { id: offeringId, moduleId } = await params;

  // ── Fetch module info ───────────────────────────────────────────────────
  const [moduleInfo] = await db
    .select({
      id: modules.id,
      title: modules.title,
      orderIndex: modules.orderIndex,
    })
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!moduleInfo) redirect("/lms/offerings");

  // ── Fetch offering + course info ────────────────────────────────────────
  const [offeringInfo] = await db
    .select({
      courseName: courses.name,
      courseCode: courses.code,
      semester: courseOfferings.semester,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1);

  if (!offeringInfo) redirect("/lms/offerings");

  // ── Fetch enrolled students ─────────────────────────────────────────────
  const enrolledStudents = await db
    .select({
      studentId: enrollments.studentId,
      studentName: users.name,
      studentNim: users.nim,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.offeringId, offeringId))
    .orderBy(asc(users.name));

  // ── Fetch existing attendance records for this module session ───────────
  const existingRecords = await db
    .select({
      studentId: attendanceRecords.studentId,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      sessionDate: attendanceRecords.sessionDate,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.offeringId, offeringId),
        eq(attendanceRecords.moduleId, moduleId),
      ),
    );

  const existingMap = new Map(
    existingRecords.map((r) => [r.studentId, r]),
  );

  // ── Merge students with their existing status ───────────────────────────
  const studentRecords = enrolledStudents.map((student) => {
    const existing = existingMap.get(student.studentId);
    return {
      studentId: student.studentId,
      studentName: student.studentName,
      studentNim: student.studentNim,
      currentStatus: (existing?.status ?? "present") as
        | "present"
        | "absent"
        | "excused"
        | "late",
      currentNotes: existing?.notes ?? null,
    };
  });

  // ── Default session date (from existing record or today) ────────────────
  const existingSessionDate = existingRecords[0]?.sessionDate;
  const defaultSessionDate = existingSessionDate
    ? new Date(existingSessionDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <AttendanceForm
      offeringId={offeringId}
      moduleId={moduleId}
      moduleTitle={moduleInfo.title}
      moduleOrder={moduleInfo.orderIndex}
      courseName={offeringInfo.courseName}
      courseCode={offeringInfo.courseCode}
      semester={offeringInfo.semester}
      studentRecords={studentRecords}
      defaultSessionDate={defaultSessionDate}
      backUrl={`/lms/offerings/${offeringId}`}
    />
  );
}
