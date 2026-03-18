"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { eq, isNull, desc, ilike, or, and, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "assistant" | "student" | "guest";
export type ActionResult = { error: string } | { success: true };

const VALID_ROLES: UserRole[] = ["super_admin", "assistant", "student", "guest"];
const PAGE_SIZE = 50;

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: admin only");
  }
  return session;
}

// ─── Get Users (paginated, filterable) ───────────────────────────────────────

export interface GetUsersOptions {
  page?: number;
  search?: string;
  role?: string;
}

export async function getUsersAction({
  page = 1,
  search,
  role,
}: GetUsersOptions) {
  await requireAdmin();

  const offset = (page - 1) * PAGE_SIZE;

  const baseWhere = isNull(users.deletedAt);

  const searchWhere = search?.trim()
    ? or(
        ilike(users.name, `%${search.trim()}%`),
        ilike(users.email, `%${search.trim()}%`),
        ilike(users.nim, `%${search.trim()}%`),
        ilike(users.username, `%${search.trim()}%`),
      )
    : undefined;

  const roleWhere =
    role && VALID_ROLES.includes(role as UserRole)
      ? eq(users.role, role as UserRole)
      : undefined;

  const whereClause = and(baseWhere, searchWhere, roleWhere);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        nim: users.nim,
        username: users.username,
        role: users.role,
        mustChangePassword: users.mustChangePassword,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)` })
      .from(users)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  return {
    users: rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ─── Get Single User ──────────────────────────────────────────────────────────

export async function getUserByIdAction(userId: string) {
  await requireAdmin();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      nim: users.nim,
      username: users.username,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return user ?? null;
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export async function softDeleteUserAction(
  userId: string,
): Promise<ActionResult> {
  await requireAdmin();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) return { error: "User not found or already deleted" };

  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Update Role ──────────────────────────────────────────────────────────────

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  await requireAdmin();

  if (!VALID_ROLES.includes(role)) {
    return { error: "Invalid role" };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) return { error: "User not found" };

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Create User ──────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(2, "Username must be at least 2 characters").max(50).regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  nim: z.string().optional(),
  role: z.enum(["super_admin", "assistant", "student", "guest"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mustChangePassword: z.coerce.boolean().default(false),
});

export async function createUserAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = createUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email") || undefined,
    nim: formData.get("nim") || undefined,
    role: formData.get("role"),
    password: formData.get("password"),
    mustChangePassword: formData.get("mustChangePassword") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { name, username, email, nim, role, password, mustChangePassword } = parse.data;

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsername) return { error: "Username already taken" };

  if (email) {
    const [existingEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingEmail) return { error: "Email already in use" };
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    name,
    username,
    email: email || null,
    nim: nim?.trim() || null,
    role: role as UserRole,
    passwordHash,
    mustChangePassword,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Update User ──────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  email: z.string().email("Email tidak valid").or(z.literal("")).optional(),
  nim: z.string().optional(),
  role: z.enum(["super_admin", "assistant", "student", "guest"]),
  mustChangePassword: z.boolean(),
});

export async function updateUserAction(
  userId: string,
  data: {
    name: string;
    email: string;
    nim?: string;
    role: string;
    mustChangePassword: boolean;
  },
): Promise<ActionResult> {
  await requireAdmin();

  const parse = updateUserSchema.safeParse(data);
  if (!parse.success) {
    return { error: parse.error.issues[0]?.message ?? "Validation error" };
  }

  const { name, email, nim, role, mustChangePassword } = parse.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) return { error: "User not found" };

  await db
    .update(users)
    .set({
      name,
      email: email || null,
      nim: nim?.trim() || null,
      role: role as UserRole,
      mustChangePassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);
  return { success: true };
}

// ─── Admin Reset Password ─────────────────────────────────────────────────────

export async function adminResetPasswordAction(
  userId: string,
  newPassword: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) return { error: "User not found" };

  const hash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash: hash, mustChangePassword: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);
  return { success: true };
}
