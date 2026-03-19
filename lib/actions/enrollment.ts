"use server";

import { db } from "@/lib/db";
import {
  users,
  courses,
  courseOfferings,
  enrollments,
  importLogs,
  auditLogs,
} from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import Papa from "papaparse";
import { redirect } from "next/navigation";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { error: string };

// ─── Types ────────────────────────────────────────────────────────────────────

interface CsvRow {
  name: string;
  nim: string;
  major: string;
  class: string;
  semester: string;
  day: string;
  shift: string;
  group: string;
  course_name: string;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  skippedRows: number;
  errors: Array<{ row: number; nim: string; reason: string }>;
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export async function importEnrollmentCsvAction(
  formData: FormData,
): Promise<ActionResult<ImportResult>> {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };
  if (!file.name.endsWith(".csv")) return { error: "File must be a CSV" };
  if (file.size > 5 * 1024 * 1024)
    return { error: "File must be smaller than 5 MB" };

  const text = await file.text();

  // Parse CSV
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const requiredColumns = [
    "name",
    "nim",
    "major",
    "class",
    "semester",
    "day",
    "shift",
    "group",
    "course_name",
  ];

  const headers = parsed.meta.fields ?? [];
  const missingCols = requiredColumns.filter((c) => !headers.includes(c));
  if (missingCols.length > 0) {
    return {
      error: `Missing required columns: ${missingCols.join(", ")}`,
    };
  }

  const rows = parsed.data;
  const result: ImportResult = {
    totalRows: rows.length,
    successCount: 0,
    skippedRows: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based + header row

    // Validate required fields per row
    if (!row.nim?.trim() || !row.name?.trim() || !row.course_name?.trim()) {
      result.errors.push({
        row: rowNum,
        nim: row.nim ?? "(empty)",
        reason: "Missing required fields: name, nim, or course_name",
      });
      result.skippedRows++;
      continue;
    }

    const nim = row.nim.trim();
    const name = row.name.trim();
    const courseName = row.course_name.trim();
    const semester = row.semester?.trim() ?? "";
    const day = row.day?.trim() ?? null;
    const shift = row.shift?.trim() ?? null;

    try {
      // 1. Find or create course
      let [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.name, courseName))
        .limit(1);

      if (!course) {
        const [newCourse] = await db
          .insert(courses)
          .values({
            name: courseName,
            code: `AUTO-${Date.now()}`,
            type: "praktikum",
            isActive: true,
          })
          .returning();
        course = newCourse;
      }

      // 2. Find or create offering
      let [offering] = await db
        .select()
        .from(courseOfferings)
        .where(
          and(
            eq(courseOfferings.courseId, course.id),
            eq(courseOfferings.semester, semester),
            day ? eq(courseOfferings.hari, day) : isNull(courseOfferings.hari),
            shift
              ? eq(courseOfferings.shift, shift)
              : isNull(courseOfferings.shift),
          ),
        )
        .limit(1);

      if (!offering) {
        const academicYear = extractAcademicYear(semester);
        const [newOffering] = await db
          .insert(courseOfferings)
          .values({
            courseId: course.id,
            semester,
            academicYear,
            hari: day ?? undefined,
            shift: shift ?? undefined,
            status: "active",
            visibility: "internal",
          })
          .returning();
        offering = newOffering;
      }

      // 3. Find or create student user
      let [student] = await db
        .select()
        .from(users)
        .where(and(eq(users.nim, nim), isNull(users.deletedAt)))
        .limit(1);

      if (!student) {
        const passwordHash = await hashPassword(nim); // NIM as initial password
        const [newStudent] = await db
          .insert(users)
          .values({
            name,
            nim,
            username: nim,
            passwordHash,
            role: "student",
            mustChangePassword: true,
          })
          .returning();
        student = newStudent;
      }

      // 4. Check for duplicate enrollment
      const [existingEnrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.offeringId, offering.id),
            eq(enrollments.studentId, student.id),
          ),
        )
        .limit(1);

      if (existingEnrollment) {
        result.errors.push({
          row: rowNum,
          nim,
          reason: `Already enrolled in offering ${offering.id}`,
        });
        result.skippedRows++;
        continue;
      }

      // 5. Insert enrollment
      await db.insert(enrollments).values({
        offeringId: offering.id,
        studentId: student.id,
        jurusan: row.major?.trim(),
        kelas: row.class?.trim(),
        kelompokCsv: row.group?.trim(),
      });

      result.successCount++;
    } catch (err) {
      result.errors.push({
        row: rowNum,
        nim,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
      result.skippedRows++;
    }
  }

  // Save import log
  await db.insert(importLogs).values({
    fileName: file.name,
    importedBy: session.user.id,
    totalRows: result.totalRows,
    successCount: result.successCount,
    skippedRows: result.skippedRows,
    errors: result.errors as unknown as Record<string, unknown>[],
  });

  // Audit
  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "csv_imported",
    entity: "enrollments",
    entityId: null,
    newData: { fileName: file.name, ...result } as unknown as Record<string, unknown>,
    metadata: { importedAt: new Date().toISOString() } as unknown as Record<string, unknown>,
  });

  return { success: true, data: result };
}

// ─── Manual Enrollment ────────────────────────────────────────────────────────

const manualEnrollSchema = z.object({
  offeringId: z.string().uuid("Invalid offering"),
  studentId: z.string().uuid().optional(),
  nim: z.string().min(1).optional(),
  name: z.string().min(2).optional(),
  groupId: z.string().uuid().optional(),
});

export async function manualEnrollAction(
  formData: FormData,
): Promise<ActionResult<{ enrollmentId: string }>> {
  const session = await getSession();
  if (!session || !["super_admin", "assistant"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const parse = manualEnrollSchema.safeParse({
    offeringId: formData.get("offeringId"),
    studentId: formData.get("studentId") || undefined,
    nim: formData.get("nim") || undefined,
    name: formData.get("name") || undefined,
    groupId: formData.get("groupId") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { offeringId, studentId, nim, name, groupId } = parse.data;

  // Resolve student
  let resolvedStudentId = studentId;

  if (!resolvedStudentId && nim) {
    let [student] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.nim, nim), isNull(users.deletedAt)))
      .limit(1);

    if (!student && name) {
      const passwordHash = await hashPassword(nim);
      const [newStudent] = await db
        .insert(users)
        .values({
          name,
          nim,
          username: nim,
          passwordHash,
          role: "student",
          mustChangePassword: true,
        })
        .returning({ id: users.id });
      student = newStudent;
    }

    if (!student) return { error: "Student not found. Provide a name to create." };
    resolvedStudentId = student.id;
  }

  if (!resolvedStudentId) return { error: "Must provide studentId or nim" };

  // Check duplicate
  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.offeringId, offeringId),
        eq(enrollments.studentId, resolvedStudentId),
      ),
    )
    .limit(1);

  if (existing) return { error: "Student is already enrolled in this offering" };

  const [enrollment] = await db
    .insert(enrollments)
    .values({
      offeringId,
      studentId: resolvedStudentId,
      groupId: groupId ?? undefined,
    })
    .returning({ id: enrollments.id });

  // Audit
  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "enrollment_created",
    entity: "enrollments",
    entityId: enrollment.id,
    newData: { offeringId, studentId: resolvedStudentId, groupId } as unknown as Record<string, unknown>,
  });

  return { success: true, data: { enrollmentId: enrollment.id } };
}

// ─── Remove Enrollment ────────────────────────────────────────────────────────

export async function removeEnrollmentAction(
  enrollmentId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const [existing] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!existing) return { error: "Enrollment not found" };

  await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "enrollment_deleted",
    entity: "enrollments",
    entityId: enrollmentId,
    oldData: existing as unknown as Record<string, unknown>,
  });

  return { success: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAcademicYear(semester: string): string {
  // e.g. "Ganjil 2024/2025" → "2024/2025"
  const match = semester.match(/\d{4}\/\d{4}/);
  return match ? match[0] : semester;
}
