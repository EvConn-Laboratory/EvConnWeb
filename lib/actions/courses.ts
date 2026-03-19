"use server";

import { db } from "@/lib/db";
import {
  courses,
  courseOfferings,
  offeringAssistants,
  enrollments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { success: true; id?: string };

// ─── Schemas ──────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  description: z.string().optional(),
  type: z.enum(["praktikum", "study_group"]),
  isActive: z.coerce.boolean().default(true),
});

const offeringSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  semester: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  hari: z.string().optional(),
  shift: z.string().optional(),
  enrollmentKey: z.string().optional(),
  status: z.enum(["draft", "active", "closed", "archived"]).default("draft"),
  visibility: z.enum(["internal", "public"]).default("internal"),
});

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: admin only");
  }
  return session;
}

async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin" && session.user.role !== "assistant") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Course CRUD ──────────────────────────────────────────────────────────────

export async function createCourseAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = courseSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    isActive: formData.get("isActive") !== "false",
  });

  if (!parse.success) return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Check for duplicate code
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.code, parse.data.code))
    .limit(1);

  if (existing) return { error: `Course code "${parse.data.code}" already exists` };

  const [created] = await db
    .insert(courses)
    .values(parse.data)
    .returning({ id: courses.id });

  revalidatePath("/admin/courses");
  return { success: true, id: created.id };
}

export async function updateCourseAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = courseSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    isActive: formData.get("isActive") !== "false",
  });

  if (!parse.success) return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Check code uniqueness excluding self
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.code, parse.data.code)))
    .limit(1);

  if (existing && existing.id !== id)
    return { error: `Course code "${parse.data.code}" is already used by another course` };

  await db
    .update(courses)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(eq(courses.id, id));

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);
  return { success: true };
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  // Force delete course and all cascading offerings/data
  await db.delete(courses).where(eq(courses.id, id));

  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function getAllCoursesAction() {
  await requireStaff();
  return db
    .select()
    .from(courses)
    .orderBy(desc(courses.createdAt));
}

export async function getCourseByIdAction(id: string) {
  await requireStaff();
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return course ?? null;
}

// ─── Course Offering CRUD ─────────────────────────────────────────────────────

export async function createOfferingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = offeringSchema.safeParse({
    courseId: formData.get("courseId"),
    semester: formData.get("semester"),
    academicYear: formData.get("academicYear"),
    hari: formData.get("hari") || undefined,
    shift: formData.get("shift") || undefined,
    enrollmentKey: formData.get("enrollmentKey") || undefined,
    status: formData.get("status") || "draft",
    visibility: formData.get("visibility") || "internal",
  });

  if (!parse.success) return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const [created] = await db
    .insert(courseOfferings)
    .values(parse.data)
    .returning({ id: courseOfferings.id });

  revalidatePath("/admin/courses/offerings");
  revalidatePath("/admin/courses");
  return { success: true, id: created.id };
}

export async function updateOfferingAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = offeringSchema.partial().safeParse({
    semester: formData.get("semester") || undefined,
    academicYear: formData.get("academicYear") || undefined,
    hari: formData.get("hari") || undefined,
    shift: formData.get("shift") || undefined,
    enrollmentKey: formData.get("enrollmentKey") || undefined,
    status: formData.get("status") || undefined,
    visibility: formData.get("visibility") || undefined,
  });

  if (!parse.success) return { error: parse.error.issues[0]?.message ?? "Validation error" };

  await db
    .update(courseOfferings)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(eq(courseOfferings.id, id));

  revalidatePath("/admin/courses/offerings");
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/offerings/${id}`);
  return { success: true };
}

export async function deleteOfferingAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  // Force delete offering and all cascading data (enrollments, assistants, modules, etc.)
  await db.delete(courseOfferings).where(eq(courseOfferings.id, id));

  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function updateOfferingStatusAction(
  id: string,
  status: "draft" | "active" | "closed" | "archived",
): Promise<ActionResult> {
  await requireAdmin();

  await db
    .update(courseOfferings)
    .set({ status, updatedAt: new Date() })
    .where(eq(courseOfferings.id, id));

  revalidatePath("/admin/courses/offerings");
  return { success: true };
}

export async function getOfferingsByAssistantAction(assistantId: string) {
  const rows = await db
    .select({
      offering: courseOfferings,
      course: courses,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .innerJoin(
      offeringAssistants,
      eq(offeringAssistants.offeringId, courseOfferings.id),
    )
    .where(eq(offeringAssistants.assistantId, assistantId));

  return rows;
}

export async function getActiveOfferingsForStudentAction(studentId: string) {
  const rows = await db
    .select({
      offering: courseOfferings,
      course: courses,
    })
    .from(enrollments)
    .innerJoin(
      courseOfferings,
      eq(enrollments.offeringId, courseOfferings.id),
    )
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(courseOfferings.status, "active"),
      ),
    );

  return rows;
}

export async function assignAssistantToOfferingAction(
  offeringId: string,
  assistantId: string,
  isLead = false,
): Promise<ActionResult> {
  await requireAdmin();

  // Check if already assigned
  const [existing] = await db
    .select({ id: offeringAssistants.id })
    .from(offeringAssistants)
    .where(
      and(
        eq(offeringAssistants.offeringId, offeringId),
        eq(offeringAssistants.assistantId, assistantId),
      ),
    )
    .limit(1);

  if (existing) return { error: "Assistant is already assigned to this offering" };

  await db.insert(offeringAssistants).values({ offeringId, assistantId, isLead });

  revalidatePath(`/admin/courses/offerings/${offeringId}`);
  return { success: true };
}

export async function removeAssistantFromOfferingAction(
  offeringId: string,
  assistantId: string,
): Promise<ActionResult> {
  await requireAdmin();

  await db
    .delete(offeringAssistants)
    .where(
      and(
        eq(offeringAssistants.offeringId, offeringId),
        eq(offeringAssistants.assistantId, assistantId),
      ),
    );

  revalidatePath(`/admin/courses/offerings/${offeringId}`);
  return { success: true };
}
