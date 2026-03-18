"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateUserAction, adminResetPasswordAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditUserFormProps {
  user: {
    id: string;
    name: string;
    email: string | null;
    nim: string | null;
    username: string;
    role: string;
    mustChangePassword: boolean;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditUserForm({ user }: EditUserFormProps) {
  const [role, setRole] = useState(user.role);
  const [mustChangePassword, setMustChangePassword] = useState(
    user.mustChangePassword,
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Password reset state
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [isPwPending, startPwTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateUserAction(user.id, {
        name: (formData.get("name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        nim:
          role === "student"
            ? ((formData.get("nim") as string) ?? undefined)
            : undefined,
        role,
        mustChangePassword,
      });

      if ("error" in res) {
        setError(res.error);
        return;
      }

      setSuccess("User berhasil diperbarui.");
    });
  }

  function handlePasswordReset() {
    setPwError(null);
    setPwSuccess(null);

    startPwTransition(async () => {
      const res = await adminResetPasswordAction(user.id, newPassword);
      if ("error" in res) {
        setPwError(res.error);
        return;
      }
      setPwSuccess("Password berhasil diubah.");
      setNewPassword("");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left: User info form ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-5 text-sm font-semibold text-foreground">
          Informasi User
        </h2>

        <form action={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name}
              required
              placeholder="Nama lengkap"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email ?? ""}
              placeholder="email@example.com"
            />
          </div>

          {/* NIM — student only, conditional */}
          {role === "student" && (
            <div className="space-y-1.5">
              <Label htmlFor="nim">NIM</Label>
              <Input
                id="nim"
                name="nim"
                defaultValue={user.nim ?? ""}
                placeholder="Nomor Induk Mahasiswa"
              />
            </div>
          )}

          {/* Username — read-only */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={user.username}
              readOnly
              disabled
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Username di-generate otomatis dan tidak dapat diubah.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="super_admin">Super Admin</option>
              <option value="assistant">Assistant</option>
              <option value="student">Student</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          {/* mustChangePassword toggle */}
          <div className="flex items-center gap-2.5">
            <input
              id="mustChangePassword"
              type="checkbox"
              checked={mustChangePassword}
              onChange={(e) => setMustChangePassword(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <Label
              htmlFor="mustChangePassword"
              className="cursor-pointer font-normal text-foreground"
            >
              Wajib ganti password saat login berikutnya
            </Label>
          </div>

          {/* Feedback */}
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {success}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className={cn(isPending && "opacity-60")}
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Right: Reset password ──────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">
          Reset Password
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Atur password baru untuk user ini. Setelah disimpan, user akan
          diwajibkan mengganti password saat login berikutnya.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
          </div>

          {/* Feedback */}
          {pwError && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {pwSuccess}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handlePasswordReset}
              disabled={isPwPending || newPassword.length < 6}
              className={cn(isPwPending && "opacity-60")}
            >
              {isPwPending ? "Mengubah..." : "Set Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
