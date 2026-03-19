"use server";

import { db } from "@/lib/db";
import {
  generations,
  assistantProfiles,
  organizationalRoles,
  assistantRoles,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, asc, desc, count, inArray } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { success: true; id?: string };

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: admin only");
  }
  return session;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const generationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  number: z.coerce.number().int().min(1, "Generation number must be positive"),
  startYear: z.coerce.number().int().min(2000).max(2100),
  endYear: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.coerce.boolean().default(false),
});

const assistantProfileSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  generationId: z.string().uuid("Invalid generation ID"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(200),
  profilePhotoPath: z.string().optional().nullable(),
  initials: z.string().max(3, "Initials must be at most 3 characters").optional().nullable().transform((v) => v?.toUpperCase() || null),
  bio: z.string().max(1000).optional().nullable(),
  githubUrl: z.string().url("Invalid GitHub URL").optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable().or(z.literal("")),
  status: z.enum(["active", "alumni"]).default("active"),
  joinedYear: z.coerce.number().int().min(2000).max(2100),
  endYear: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const organizationalRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// ─── Generation CRUD ──────────────────────────────────────────────────────────

export async function createGenerationAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = generationSchema.safeParse({
    name: formData.get("name"),
    number: formData.get("number"),
    startYear: formData.get("startYear"),
    endYear: formData.get("endYear") || null,
    description: formData.get("description") || null,
    isActive: formData.get("isActive") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Check for duplicate generation number
  const [existing] = await db
    .select({ id: generations.id })
    .from(generations)
    .where(eq(generations.number, parse.data.number))
    .limit(1);

  if (existing)
    return { error: `Generation number ${parse.data.number} already exists` };

  // If setting as active, deactivate others first
  if (parse.data.isActive) {
    await db
      .update(generations)
      .set({ isActive: false })
      .where(eq(generations.isActive, true));
  }

  const [created] = await db
    .insert(generations)
    .values(parse.data)
    .returning({ id: generations.id });

  revalidatePath("/admin/hall-of-fame/generations");
  revalidatePath("/hall-of-fame");
  return { success: true, id: created.id };
}

export async function updateGenerationAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = generationSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    number: formData.get("number") || undefined,
    startYear: formData.get("startYear") || undefined,
    endYear: formData.get("endYear") || null,
    description: formData.get("description") || null,
    isActive: formData.get("isActive") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // If activating this generation, deactivate all others
  if (parse.data.isActive) {
    await db
      .update(generations)
      .set({ isActive: false })
      .where(eq(generations.isActive, true));
  }

  await db
    .update(generations)
    .set(parse.data)
    .where(eq(generations.id, id));

  revalidatePath("/admin/hall-of-fame/generations");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function deleteGenerationAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  // Check that no assistants belong to this generation
  const [memberCount] = await db
    .select({ c: count() })
    .from(assistantProfiles)
    .where(eq(assistantProfiles.generationId, id));

  if (memberCount.c > 0)
    return {
      error: `Cannot delete: ${memberCount.c} assistant(s) belong to this generation. Remove them first.`,
    };

  await db.delete(generations).where(eq(generations.id, id));

  revalidatePath("/admin/hall-of-fame/generations");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function getAllGenerationsAction() {
  return db
    .select()
    .from(generations)
    .orderBy(desc(generations.number));
}

export async function getGenerationByIdAction(id: string) {
  const [gen] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, id))
    .limit(1);
  return gen ?? null;
}

export async function setActiveGenerationAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  // Deactivate all, then activate the target
  await db.update(generations).set({ isActive: false });
  await db
    .update(generations)
    .set({ isActive: true })
    .where(eq(generations.id, id));

  revalidatePath("/admin/hall-of-fame/generations");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

// ─── Assistant Profile CRUD ───────────────────────────────────────────────────

export async function createAssistantProfileAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = assistantProfileSchema.safeParse({
    userId: formData.get("userId") || null,
    generationId: formData.get("generationId"),
    fullName: formData.get("fullName"),
    profilePhotoPath: formData.get("profilePhotoPath") || null,
    initials: formData.get("initials") || null,
    bio: formData.get("bio") || null,
    githubUrl: formData.get("githubUrl") || null,
    instagramUrl: formData.get("instagramUrl") || null,
    linkedinUrl: formData.get("linkedinUrl") || null,
    status: formData.get("status") || "active",
    joinedYear: formData.get("joinedYear"),
    endYear: formData.get("endYear") || null,
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Enforce max 20 members per generation
  const [memberCount] = await db
    .select({ c: count() })
    .from(assistantProfiles)
    .where(eq(assistantProfiles.generationId, parse.data.generationId));

  if (memberCount.c >= 20)
    return {
      error: "A generation can have at most 20 members (PRD §14.1).",
    };

  // Nullify empty URLs
  const data = {
    ...parse.data,
    githubUrl: parse.data.githubUrl || null,
    instagramUrl: parse.data.instagramUrl || null,
    linkedinUrl: parse.data.linkedinUrl || null,
  };

  const [created] = await db
    .insert(assistantProfiles)
    .values(data)
    .returning({ id: assistantProfiles.id });

  // Handle role assignments
  const roleIds = formData.getAll("roleIds") as string[];
  if (roleIds.length > 0) {
    const roleValues = roleIds.map((rid) => ({
      assistantId: created.id,
      roleId: rid,
    }));
    await db.insert(assistantRoles).values(roleValues);
  }

  revalidatePath("/admin/hall-of-fame/assistants");
  revalidatePath("/hall-of-fame");
  return { success: true, id: created.id };
}

export async function updateAssistantProfileAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = assistantProfileSchema.partial().safeParse({
    userId: formData.get("userId") || null,
    generationId: formData.get("generationId") || undefined,
    fullName: formData.get("fullName") || undefined,
    profilePhotoPath: formData.get("profilePhotoPath") || null,
    initials: formData.get("initials") || null,
    bio: formData.get("bio") || null,
    githubUrl: formData.get("githubUrl") || null,
    instagramUrl: formData.get("instagramUrl") || null,
    linkedinUrl: formData.get("linkedinUrl") || null,
    status: formData.get("status") || undefined,
    joinedYear: formData.get("joinedYear") || undefined,
    endYear: formData.get("endYear") || null,
    sortOrder: formData.get("sortOrder") ?? undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const data = {
    ...parse.data,
    githubUrl: parse.data.githubUrl || null,
    instagramUrl: parse.data.instagramUrl || null,
    linkedinUrl: parse.data.linkedinUrl || null,
    updatedAt: new Date(),
  };

  await db
    .update(assistantProfiles)
    .set(data)
    .where(eq(assistantProfiles.id, id));

  // Sync roles if provided
  const roleIds = formData.getAll("roleIds") as string[];
  if (roleIds.length > 0 || formData.has("roleIds")) {
    // If 'roleIds' key exists but empty, remove all. If has values, sync them.
    await db.delete(assistantRoles).where(eq(assistantRoles.assistantId, id));
    if (roleIds.length > 0) {
      const roleValues = roleIds.map((rid) => ({
        assistantId: id,
        roleId: rid,
      }));
      await db.insert(assistantRoles).values(roleValues);
    }
  }

  revalidatePath("/admin/hall-of-fame/assistants");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function deleteAssistantProfileAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  // Remove all role assignments first
  await db
    .delete(assistantRoles)
    .where(eq(assistantRoles.assistantId, id));

  await db
    .delete(assistantProfiles)
    .where(eq(assistantProfiles.id, id));

  revalidatePath("/admin/hall-of-fame/assistants");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function getAssistantsByGenerationAction(generationId: string) {
  return db
    .select()
    .from(assistantProfiles)
    .where(eq(assistantProfiles.generationId, generationId))
    .orderBy(asc(assistantProfiles.sortOrder), asc(assistantProfiles.fullName));
}

export async function getAllAssistantsWithRolesAction() {
  const profiles = await db
    .select()
    .from(assistantProfiles)
    .orderBy(desc(assistantProfiles.joinedYear), asc(assistantProfiles.sortOrder));

  // Fetch role assignments
  const roleAssignments = await db
    .select({
      assistantId: assistantRoles.assistantId,
      roleId: assistantRoles.roleId,
      roleName: organizationalRoles.name,
      roleSortOrder: organizationalRoles.sortOrder,
    })
    .from(assistantRoles)
    .innerJoin(
      organizationalRoles,
      eq(assistantRoles.roleId, organizationalRoles.id),
    );

  // Group roles by assistant
  const rolesByAssistant = new Map<
    string,
    Array<{ roleId: string; roleName: string; sortOrder: number }>
  >();

  for (const r of roleAssignments) {
    const existing = rolesByAssistant.get(r.assistantId) ?? [];
    existing.push({
      roleId: r.roleId,
      roleName: r.roleName,
      sortOrder: r.roleSortOrder,
    });
    rolesByAssistant.set(r.assistantId, existing);
  }

  return profiles.map((p) => ({
    ...p,
    roles: (rolesByAssistant.get(p.id) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    ),
  }));
}

/** Users with role assistant or super_admin, for linking to Hall of Fame profiles. */
export async function getUsersForAssistantLinkingAction() {
  await requireAdmin();
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["assistant", "super_admin"]))
    .orderBy(users.name);
}

export async function reorderAssistantsAction(
  generationId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(assistantProfiles)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(
        and(
          eq(assistantProfiles.id, orderedIds[i]),
          eq(assistantProfiles.generationId, generationId),
        ),
      );
  }

  revalidatePath("/admin/hall-of-fame/assistants");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

// ─── Organizational Role CRUD ─────────────────────────────────────────────────

export async function createOrgRoleAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = organizationalRoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Check for duplicate role name
  const [existing] = await db
    .select({ id: organizationalRoles.id })
    .from(organizationalRoles)
    .where(eq(organizationalRoles.name, parse.data.name))
    .limit(1);

  if (existing)
    return { error: `A role named "${parse.data.name}" already exists` };

  const [created] = await db
    .insert(organizationalRoles)
    .values(parse.data)
    .returning({ id: organizationalRoles.id });

  revalidatePath("/admin/hall-of-fame/roles");
  return { success: true, id: created.id };
}

export async function updateOrgRoleAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = organizationalRoleSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || null,
    sortOrder: formData.get("sortOrder") ?? undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  await db
    .update(organizationalRoles)
    .set(parse.data)
    .where(eq(organizationalRoles.id, id));

  revalidatePath("/admin/hall-of-fame/roles");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function deleteOrgRoleAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  // Check if any assistants are assigned to this role
  const [assignedCount] = await db
    .select({ c: count() })
    .from(assistantRoles)
    .where(eq(assistantRoles.roleId, id));

  if (assignedCount.c > 0)
    return {
      error: `Cannot delete: ${assignedCount.c} assistant(s) are assigned to this role. Unassign them first.`,
    };

  await db
    .delete(organizationalRoles)
    .where(eq(organizationalRoles.id, id));

  revalidatePath("/admin/hall-of-fame/roles");
  return { success: true };
}

export async function getAllOrgRolesAction() {
  return db
    .select()
    .from(organizationalRoles)
    .orderBy(asc(organizationalRoles.sortOrder), asc(organizationalRoles.name));
}

// ─── Assistant Role Assignment ────────────────────────────────────────────────

export async function assignRoleToAssistantAction(
  assistantId: string,
  roleId: string,
): Promise<ActionResult> {
  await requireAdmin();

  // Check if already assigned
  const [existing] = await db
    .select({ id: assistantRoles.id })
    .from(assistantRoles)
    .where(
      and(
        eq(assistantRoles.assistantId, assistantId),
        eq(assistantRoles.roleId, roleId),
      ),
    )
    .limit(1);

  if (existing)
    return { error: "This role is already assigned to the assistant" };

  await db.insert(assistantRoles).values({ assistantId, roleId });

  revalidatePath("/admin/hall-of-fame/assistants");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function removeRoleFromAssistantAction(
  assistantId: string,
  roleId: string,
): Promise<ActionResult> {
  await requireAdmin();

  await db
    .delete(assistantRoles)
    .where(
      and(
        eq(assistantRoles.assistantId, assistantId),
        eq(assistantRoles.roleId, roleId),
      ),
    );

  revalidatePath("/admin/hall-of-fame/assistants");
  revalidatePath("/hall-of-fame");
  return { success: true };
}

export async function getRolesForAssistantAction(assistantId: string) {
  return db
    .select({
      id: organizationalRoles.id,
      name: organizationalRoles.name,
      description: organizationalRoles.description,
      sortOrder: organizationalRoles.sortOrder,
      assignedAt: assistantRoles.assignedAt,
    })
    .from(assistantRoles)
    .innerJoin(
      organizationalRoles,
      eq(assistantRoles.roleId, organizationalRoles.id),
    )
    .where(eq(assistantRoles.assistantId, assistantId))
    .orderBy(asc(organizationalRoles.sortOrder));
}

// ─── Hall of Fame public query ────────────────────────────────────────────────

/**
 * Returns all generations with their assistants and roles,
 * sorted newest-first with role hierarchy per the PRD §14.4.
 */
export async function getHallOfFameAction() {
  try {
  const allGenerations = await db
    .select()
    .from(generations)
    .orderBy(desc(generations.number));

  const allProfiles = await db
    .select()
    .from(assistantProfiles)
    .orderBy(asc(assistantProfiles.sortOrder), asc(assistantProfiles.fullName));

  const allRoleAssignments = await db
    .select({
      assistantId: assistantRoles.assistantId,
      roleId: organizationalRoles.id,
      roleName: organizationalRoles.name,
      roleSortOrder: organizationalRoles.sortOrder,
    })
    .from(assistantRoles)
    .innerJoin(
      organizationalRoles,
      eq(assistantRoles.roleId, organizationalRoles.id),
    );

  // Group roles by assistant
  const rolesByAssistant = new Map<
    string,
    Array<{ roleId: string; roleName: string; sortOrder: number }>
  >();

  for (const r of allRoleAssignments) {
    const existing = rolesByAssistant.get(r.assistantId) ?? [];
    existing.push({
      roleId: r.roleId,
      roleName: r.roleName,
      sortOrder: r.roleSortOrder,
    });
    rolesByAssistant.set(r.assistantId, existing);
  }

  // Build structured data
  return allGenerations.map((gen) => {
    const members = allProfiles
      .filter((p) => p.generationId === gen.id)
      .map((p) => ({
        ...p,
        roles: (rolesByAssistant.get(p.id) ?? []).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        ),
      }))
      .sort((a, b) => {
        // Sort by lowest role sort order first, then alphabetically
        const aMin = Math.min(...(a.roles.map((r) => r.sortOrder).length > 0 ? a.roles.map((r) => r.sortOrder) : [999]));
        const bMin = Math.min(...(b.roles.map((r) => r.sortOrder).length > 0 ? b.roles.map((r) => r.sortOrder) : [999]));
        if (aMin !== bMin) return aMin - bMin;
        return a.fullName.localeCompare(b.fullName);
      });

    return { generation: gen, members };
  });
  } catch {
    return [];
  }
}
