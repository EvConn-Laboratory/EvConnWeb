import { redirect } from "next/navigation";
import { eq, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  certificates,
  users,
  enrollments,
  courseOfferings,
  courses,
} from "@/lib/db/schema";
import { Award } from "lucide-react";
import { CertificateManager } from "./CertificateManager";

export const metadata = { title: "Certificates Management | Admin" };

export default async function AdminCertificatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/lms/dashboard");

  const [certificateRows, candidateRows] = await Promise.all([
    db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        revokedAt: certificates.revokedAt,
        revokedReason: certificates.revokedReason,
        studentName: users.name,
        studentNim: users.nim,
        courseName: courses.name,
        courseCode: courses.code,
        semester: courseOfferings.semester,
        academicYear: courseOfferings.academicYear,
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.studentId, users.id))
      .innerJoin(courseOfferings, eq(certificates.offeringId, courseOfferings.id))
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .orderBy(desc(certificates.issuedAt)),
    db
      .select({
        offeringId: enrollments.offeringId,
        semester: courseOfferings.semester,
        academicYear: courseOfferings.academicYear,
        courseName: courses.name,
        courseCode: courses.code,
        studentId: users.id,
        studentName: users.name,
        studentNim: users.nim,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .innerJoin(courseOfferings, eq(enrollments.offeringId, courseOfferings.id))
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .orderBy(asc(courses.code), asc(users.name)),
  ]);

  const certificatesView = certificateRows.map((c) => ({
    id: c.id,
    certificateNumber: c.certificateNumber,
    issuedAt: c.issuedAt.toISOString(),
    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
    revokedReason: c.revokedReason,
    studentName: c.studentName,
    studentNim: c.studentNim,
    courseName: c.courseName,
    courseCode: c.courseCode,
    offeringLabel: `${c.courseCode} ${c.semester} ${c.academicYear}`,
  }));

  const candidatesView = candidateRows.map((c) => ({
    offeringId: c.offeringId,
    offeringLabel: `${c.courseCode} · ${c.courseName} · ${c.semester} ${c.academicYear}`,
    studentId: c.studentId,
    studentName: c.studentName,
    studentNim: c.studentNim,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Certificates Management
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground text-left">
          Issue completion certificates and manage revocations.
        </p>
      </div>

      <CertificateManager candidates={candidatesView} certificates={certificatesView} />
    </div>
  );
}
