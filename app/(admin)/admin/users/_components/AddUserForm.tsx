"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createUserAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createUserAction(null, formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-3.5 w-3.5" />
        Add User
      </Button>

      {open && (
        <form
          action={handleSubmit}
          className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-semibold text-foreground">New User</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <input
              name="name"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Username</label>
            <input
              name="username"
              required
              pattern="[a-z0-9_]+"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="johndoe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              placeholder="Min. 6 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Role</label>
            <select
              name="role"
              defaultValue="student"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="student">Student</option>
              <option value="assistant">Assistant</option>
              <option value="super_admin">Super Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Email <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="email"
              type="email"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              NIM <span className="text-muted-foreground">(students only)</span>
            </label>
            <input
              name="nim"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="12345678"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              name="mustChangePassword"
              value="true"
              className="rounded"
            />
            Require password change on first login
          </label>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground",
                isPending && "opacity-60",
              )}
            >
              {isPending ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
