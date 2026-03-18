"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, hashPassword } from "./password";
import { signToken } from "./jwt";
import { SESSION_COOKIE, getSession } from "./session";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

export type ActionResult = { error: string } | { success: true };

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parse = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parse.success) return { error: "Please fill in all fields" };

  const { username, password } = parse.data;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.username, username), isNull(users.deletedAt)))
    .limit(1);

  if (!user) return { error: "Invalid username or password" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid username or password" };

  const token = await signToken({
    sub: user.id,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  if (user.mustChangePassword) redirect("/change-password");
  if (user.role === "super_admin") redirect("/admin/dashboard");
  redirect("/lms/dashboard");
}

// ─── Guest Registration ───────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerGuestAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parse = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { name, email, password } = parse.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await hashPassword(password);
  const username = email.split("@")[0] + "_" + Date.now();

  await db.insert(users).values({
    name,
    email,
    username,
    passwordHash,
    role: "guest",
    mustChangePassword: false,
  });

  redirect("/login?registered=1");
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

// ─── Change Password ──────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parse = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { password } = parse.data;
  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  // Re-issue token with mustChangePassword: false
  const token = await signToken({
    sub: session.user.id,
    name: session.user.name,
    role: session.user.role,
    mustChangePassword: false,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  if (session.user.role === "super_admin") redirect("/admin/dashboard");
  redirect("/lms/dashboard");
}
