"use server";

import { db } from "@/lib/db";
import {
  groups,
  groupAssistants,
  enrollments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq, and, max } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    redirect("/lms/dashboard");
  }
  return session;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createGroupSchema = z.object({
  offeringId: z.string().uuid(),
  name: z.string().max(100).optional(),
});

const updateGroupSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().max(100).optional().nullable(),
});

const deleteGroupSchema = z.object({
  groupId: z.string().uuid(),
});

const assignStudentSchema = z.object({
  offeringId: z.string().uuid(),
  studentId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
});

const moveStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid()),
  fromGroupId: z.string().uuid().nullable(),
  toGroupId: z.string().uuid().nullable(),
  offeringId: z.string().uuid(),
});

const assignAssistantToGroupSchema = z.object({
  groupId: z.string().uuid(),
  assistantId: z.string().uuid(),
});

// ─── Create group ─────────────────────────────────────────────────────────────

export async function createGroupAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = createGroupSchema.safeParse({
    offeringId: formData.get("offeringId"),
    name: formData.get("name") || undefined,
  });
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { offeringId, name } = parse.data;

  // Auto-increment group number within offering
  const result = await db
    .select({ maxNumber: max(groups.number) })
    .from(groups)
    .where(eq(groups.offeringId, offeringId));

  const nextNumber = (result[0]?.maxNumber ?? 0) + 1;

  await db.insert(groups).values({
    offeringId,
    number: nextNumber,
    name: name ?? `Kelompok ${nextNumber}`,
  });

  return { success: true };
}

// ─── Update group ─────────────────────────────────────────────────────────────

export async function updateGroupAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = updateGroupSchema.safeParse({
    groupId: formData.get("groupId"),
    name: formData.get("name"),
  });
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { groupId, name } = parse.data;

  await db
    .update(groups)
    .set({ name })
    .where(eq(groups.id, groupId));

  return { success: true };
}

// ─── Delete group ─────────────────────────────────────────────────────────────

export async function deleteGroupAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = deleteGroupSchema.safeParse({
    groupId: formData.get("groupId"),
  });
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { groupId } = parse.data;

  // Unassign all students from this group first
  await db
    .update(enrollments)
    .set({ groupId: null })
    .where(eq(enrollments.groupId, groupId));

  // Remove assistant assignments
  await db
    .delete(groupAssistants)
    .where(eq(groupAssistants.groupId, groupId));

  // Delete the group
  await db.delete(groups).where(eq(groups.id, groupId));

  return { success: true };
}

// ─── Assign student to group ──────────────────────────────────────────────────

export async function assignStudentToGroupAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = assignStudentSchema.safeParse({
    offeringId: formData.get("offeringId"),
    studentId: formData.get("studentId"),
    groupId: formData.get("groupId") || null,
  });
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { offeringId, studentId, groupId } = parse.data;

  // Verify enrollment exists
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.offeringId, offeringId),
        eq(enrollments.studentId, studentId),
      ),
    )
    .limit(1);

  if (!enrollment) return { error: "Student is not enrolled in this offering" };

  await db
    .update(enrollments)
    .set({ groupId })
    .where(
      and(
        eq(enrollments.offeringId, offeringId),
        eq(enrollments.studentId, studentId),
      ),
    );

  return { success: true };
}

// ─── Move multiple students ───────────────────────────────────────────────────

export async function moveStudentsAction(
  data: z.infer<typeof moveStudentsSchema>,
): Promise<ActionResult> {
  await requireStaff();

  const parse = moveStudentsSchema.safeParse(data);
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { studentIds, toGroupId, offeringId } = parse.data;

  for (const studentId of studentIds) {
    await db
      .update(enrollments)
      .set({ groupId: toGroupId })
      .where(
        and(
          eq(enrollments.offeringId, offeringId),
          eq(enrollments.studentId, studentId),
        ),
      );
  }

  return { success: true };
}

// ─── Assign assistant to group ────────────────────────────────────────────────

export async function assignAssistantToGroupAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = assignAssistantToGroupSchema.safeParse({
    groupId: formData.get("groupId"),
    assistantId: formData.get("assistantId"),
  });
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { groupId, assistantId } = parse.data;

  // Check if already assigned
  const [existing] = await db
    .select({ id: groupAssistants.id })
    .from(groupAssistants)
    .where(
      and(
        eq(groupAssistants.groupId, groupId),
        eq(groupAssistants.assistantId, assistantId),
      ),
    )
    .limit(1);

  if (existing) return { error: "Assistant is already assigned to this group" };

  await db.insert(groupAssistants).values({ groupId, assistantId });

  return { success: true };
}

// ─── Remove assistant from group ─────────────────────────────────────────────

export async function removeAssistantFromGroupAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = assignAssistantToGroupSchema.safeParse({
    groupId: formData.get("groupId"),
    assistantId: formData.get("assistantId"),
  });
  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Invalid input" };

  const { groupId, assistantId } = parse.data;

  await db
    .delete(groupAssistants)
    .where(
      and(
        eq(groupAssistants.groupId, groupId),
        eq(groupAssistants.assistantId, assistantId),
      ),
    );

  return { success: true };
}
