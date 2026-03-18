"use server";

import { db } from "@/lib/db";
import {
  modules,
  contentItems,
  moduleCompletions,
  submissions,
  feedbackEntries,
  assignments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, asc, inArray } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { success: true; id?: string };

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

const moduleSchema = z.object({
  offeringId: z.string().uuid("Invalid offering ID"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  orderIndex: z.coerce.number().int().min(0).default(0),
  openDatetime: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  closeDatetime: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  status: z.enum(["draft", "scheduled", "open", "closed"]).default("draft"),
  manualOverride: z.enum(["force_open", "force_close"]).nullable().optional(),
});

const updateModuleSchema = moduleSchema.partial().omit({ offeringId: true });

const contentItemSchema = z.object({
  moduleId: z.string().uuid("Invalid module ID"),
  type: z.enum([
    "pdf_material",
    "slide_material",
    "video_embed",
    "external_link",
    "assignment_reference",
  ]),
  title: z.string().min(1, "Title is required").max(200),
  contentData: z.string().min(2, "Content data is required"), // JSON string
  orderIndex: z.coerce.number().int().min(0).default(0),
  isPublished: z.coerce.boolean().default(false),
});

// ─── Module CRUD ──────────────────────────────────────────────────────────────

export async function createModuleAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = moduleSchema.safeParse({
    offeringId: formData.get("offeringId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    orderIndex: formData.get("orderIndex") ?? 0,
    openDatetime: formData.get("openDatetime") || undefined,
    closeDatetime: formData.get("closeDatetime") || undefined,
    status: formData.get("status") ?? "draft",
    manualOverride: formData.get("manualOverride") || null,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { openDatetime, closeDatetime } = parse.data;

  // Enforce: closeDatetime must be after openDatetime if both are set
  if (openDatetime && closeDatetime && closeDatetime <= openDatetime) {
    return { error: "Close date must be after open date" };
  }

  const [created] = await db
    .insert(modules)
    .values({
      ...parse.data,
      openDatetime: openDatetime ?? undefined,
      closeDatetime: closeDatetime ?? undefined,
      manualOverride: parse.data.manualOverride ?? undefined,
    })
    .returning({ id: modules.id });

  revalidatePath(`/lms/offerings/${parse.data.offeringId}`);
  return { success: true, id: created.id };
}

export async function updateModuleAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = updateModuleSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    orderIndex: formData.get("orderIndex") ?? undefined,
    openDatetime: formData.get("openDatetime") || undefined,
    closeDatetime: formData.get("closeDatetime") || undefined,
    status: formData.get("status") || undefined,
    manualOverride: formData.get("manualOverride") || null,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { openDatetime, closeDatetime } = parse.data;

  if (openDatetime && closeDatetime && closeDatetime <= openDatetime) {
    return { error: "Close date must be after open date" };
  }

  await db
    .update(modules)
    .set({
      ...parse.data,
      openDatetime: openDatetime ?? undefined,
      closeDatetime: closeDatetime ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(modules.id, id));

  revalidatePath(`/lms/courses`);
  revalidatePath(`/admin/courses`);
  return { success: true };
}

export async function deleteModuleAction(id: string): Promise<ActionResult> {
  await requireStaff();

  // Soft-delete by setting status to closed; content items cascade naturally
  await db
    .update(modules)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(modules.id, id));

  return { success: true };
}

export async function publishModuleAction(id: string): Promise<ActionResult> {
  await requireStaff();

  await db
    .update(modules)
    .set({ status: "open", updatedAt: new Date() })
    .where(eq(modules.id, id));

  return { success: true };
}

export async function getModulesByOfferingAction(offeringId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  return db
    .select()
    .from(modules)
    .where(eq(modules.offeringId, offeringId))
    .orderBy(asc(modules.orderIndex));
}

export async function getModuleByIdAction(id: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [module] = await db
    .select()
    .from(modules)
    .where(eq(modules.id, id))
    .limit(1);

  return module ?? null;
}

export async function reorderModulesAction(
  offeringId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireStaff();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(modules)
      .set({ orderIndex: i, updatedAt: new Date() })
      .where(
        and(eq(modules.id, orderedIds[i]), eq(modules.offeringId, offeringId)),
      );
  }

  revalidatePath(`/lms/offerings/${offeringId}`);
  return { success: true };
}

// ─── Content Items CRUD ───────────────────────────────────────────────────────

export async function createContentItemAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = contentItemSchema.safeParse({
    moduleId: formData.get("moduleId"),
    type: formData.get("type"),
    title: formData.get("title"),
    contentData: formData.get("contentData"),
    orderIndex: formData.get("orderIndex") ?? 0,
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Validate contentData is valid JSON
  try {
    JSON.parse(parse.data.contentData);
  } catch {
    return { error: "contentData must be valid JSON" };
  }

  const [created] = await db
    .insert(contentItems)
    .values(parse.data)
    .returning({ id: contentItems.id });

  revalidatePath(`/lms/courses`);
  revalidatePath(`/admin/courses`);
  return { success: true, id: created.id };
}

export async function updateContentItemAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const parse = contentItemSchema.partial().safeParse({
    title: formData.get("title") || undefined,
    contentData: formData.get("contentData") || undefined,
    orderIndex: formData.get("orderIndex") ?? undefined,
    isPublished: formData.get("isPublished") === "true",
    type: formData.get("type") || undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  if (parse.data.contentData) {
    try {
      JSON.parse(parse.data.contentData);
    } catch {
      return { error: "contentData must be valid JSON" };
    }
  }

  await db
    .update(contentItems)
    .set(parse.data)
    .where(eq(contentItems.id, id));

  return { success: true };
}

export async function deleteContentItemAction(id: string): Promise<ActionResult> {
  await requireStaff();

  await db.delete(contentItems).where(eq(contentItems.id, id));

  return { success: true };
}

export async function toggleContentItemPublishedAction(
  id: string,
  isPublished: boolean,
): Promise<ActionResult> {
  await requireStaff();

  await db
    .update(contentItems)
    .set({ isPublished })
    .where(eq(contentItems.id, id));

  return { success: true };
}

export async function getContentItemsByModuleAction(moduleId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isStaff =
    session.user.role === "assistant" || session.user.role === "super_admin";

  // Staff see all; students only see published
  const rows = await db
    .select()
    .from(contentItems)
    .where(
      isStaff
        ? eq(contentItems.moduleId, moduleId)
        : and(
            eq(contentItems.moduleId, moduleId),
            eq(contentItems.isPublished, true),
          ),
    )
    .orderBy(asc(contentItems.orderIndex));

  return rows;
}

export async function reorderContentItemsAction(
  moduleId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireStaff();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(contentItems)
      .set({ orderIndex: i })
      .where(
        and(
          eq(contentItems.id, orderedIds[i]),
          eq(contentItems.moduleId, moduleId),
        ),
      );
  }

  return { success: true };
}

// ─── Module Completion ────────────────────────────────────────────────────────

/**
 * Checks and updates module completion for a student.
 * Called after every submission or feedback event.
 *
 * Completion = ALL required assignments submitted AND all 3 feedbacks submitted.
 */
export async function checkAndUpdateModuleCompletionAction(
  moduleId: string,
  studentId: string,
): Promise<{ isComplete: boolean }> {
  // Get all required assignments for this module
  const requiredAssignments = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(
        eq(assignments.moduleId, moduleId),
        eq(assignments.isRequired, true),
        eq(assignments.isPublished, true),
      ),
    );

  if (requiredAssignments.length === 0) {
    // No required assignments — check only feedback
  } else {
    // Check all required assignments are submitted
    const submittedIds = await db
      .select({ assignmentId: submissions.assignmentId })
      .from(submissions)
      .where(
        and(
          eq(submissions.studentId, studentId),
          inArray(
            submissions.assignmentId,
            requiredAssignments.map((a) => a.id),
          ),
        ),
      );

    if (submittedIds.length < requiredAssignments.length) {
      // Not all required assignments submitted yet
      await upsertCompletion(moduleId, studentId, false);
      return { isComplete: false };
    }
  }

  // Check all 3 feedback types submitted
  const feedbackSubmitted = await db
    .select({ type: feedbackEntries.type })
    .from(feedbackEntries)
    .where(
      and(
        eq(feedbackEntries.moduleId, moduleId),
        eq(feedbackEntries.studentId, studentId),
      ),
    );

  const feedbackTypes = feedbackSubmitted.map((f) => f.type);
  const allFeedbackDone =
    feedbackTypes.includes("assistant") &&
    feedbackTypes.includes("session") &&
    feedbackTypes.includes("laboratory");

  const isComplete = allFeedbackDone;

  await upsertCompletion(moduleId, studentId, isComplete);
  return { isComplete };
}

async function upsertCompletion(
  moduleId: string,
  studentId: string,
  isComplete: boolean,
) {
  const [existing] = await db
    .select({ id: moduleCompletions.id })
    .from(moduleCompletions)
    .where(
      and(
        eq(moduleCompletions.moduleId, moduleId),
        eq(moduleCompletions.studentId, studentId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(moduleCompletions)
      .set({
        isComplete,
        completedAt: isComplete ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(moduleCompletions.id, existing.id));
  } else {
    await db.insert(moduleCompletions).values({
      moduleId,
      studentId,
      isComplete,
      completedAt: isComplete ? new Date() : null,
    });
  }
}

export async function getModuleCompletionStatusAction(
  moduleId: string,
  studentId: string,
) {
  const [completion] = await db
    .select()
    .from(moduleCompletions)
    .where(
      and(
        eq(moduleCompletions.moduleId, moduleId),
        eq(moduleCompletions.studentId, studentId),
      ),
    )
    .limit(1);

  return completion ?? null;
}
