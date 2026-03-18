import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  KeyRound,
  BookOpen,
  GraduationCap,
  CalendarDays,
  User,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, enrollments, offeringAssistants } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Profil" };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  assistant: "Asisten",
  student: "Mahasiswa",
  guest: "Guest",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-400",
  assistant: "bg-blue-500/10 text-blue-400",
  student: "bg-green-500/10 text-green-400",
  guest: "bg-muted text-muted-foreground",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  let enrollmentCount = 0;
  let offeringCount = 0;
  if (user.role === "student") {
    const [row] = await db
      .select({ value: count() })
      .from(enrollments)
      .where(eq(enrollments.studentId, user.id));
    enrollmentCount = Number(row?.value ?? 0);
  } else if (user.role === "assistant" || user.role === "super_admin") {
    const [row] = await db
      .select({ value: count() })
      .from(offeringAssistants)
      .where(eq(offeringAssistants.assistantId, user.id));
    offeringCount = Number(row?.value ?? 0);
  }

  async function updateNameAction(formData: FormData) {
    "use server";
    const innerSession = await getSession();
    if (!innerSession) return;
    const name = formData.get("name");
    if (typeof name !== "string" || name.trim().length < 2) return;
    await db
      .update(users)
      .set({ name: name.trim(), updatedAt: new Date() })
      .where(eq(users.id, innerSession.user.id));
    revalidatePath("/lms/profile");
  }

  const initials = getInitials(user.name);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.guest;

  const details = [
    { label: "Nama Lengkap", value: user.name },
    { label: "Username", value: `@${user.username}` },
    ...(user.email ? [{ label: "Email", value: user.email }] : []),
    ...(user.nim ? [{ label: "NIM", value: user.nim }] : []),
    { label: "Peran", value: roleLabel },
    { label: "Bergabung", value: formatDate(user.createdAt) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi akun dan pengaturan profil Anda.
        </p>
      </div>

      {/* Profile hero */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center bg-primary text-xl font-bold text-primary-foreground"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
            aria-hidden
          >
            {initials || <User className="h-6 w-6" />}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor}`}
              >
                {roleLabel}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              @{user.username}
            </p>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
              <CalendarDays className="h-3.5 w-3.5" />
              Bergabung {formatDate(user.createdAt)}
            </div>
          </div>

          <Link
            href="/change-password"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Ganti Password
          </Link>
        </div>
      </div>

      {/* Role stat */}
      {user.role === "student" && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <BookOpen className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {enrollmentCount}
            </p>
            <p className="text-xs text-muted-foreground">
              Mata kuliah yang diikuti
            </p>
          </div>
        </div>
      )}
      {(user.role === "assistant" || user.role === "super_admin") && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <GraduationCap className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {offeringCount}
            </p>
            <p className="text-xs text-muted-foreground">Offering yang diampu</p>
          </div>
        </div>
      )}

      {/* Account details */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Detail Akun
        </h3>
        <div className="space-y-2">
          {details.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-4 py-2.5"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-right text-xs font-medium text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Edit Profil
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Hanya nama yang dapat diubah. Field lain dikelola administrator.
        </p>
        <form action={updateNameAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-foreground">
              Nama Lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              minLength={2}
              required
              placeholder="Masukkan nama lengkap"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}
