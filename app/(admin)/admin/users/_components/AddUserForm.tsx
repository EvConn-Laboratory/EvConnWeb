"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { createUserAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createUserAction(null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground text-left block">Full Name</label>
              <input
                name="name"
                required
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground text-left block">Username</label>
              <input
                name="username"
                required
                pattern="[a-z0-9_]+"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground text-left block">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground text-left block">Role</label>
              <select
                name="role"
                defaultValue="student"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="student">Student</option>
                <option value="assistant">Assistant</option>
                <option value="super_admin">Super Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground text-left block">
                Email <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="email"
                type="email"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground text-left block">
                NIM <span className="text-muted-foreground">(students only)</span>
              </label>
              <input
                name="nim"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="12345678"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                name="mustChangePassword"
                value="true"
                className="rounded border-border"
              />
              Require password change on first login
            </label>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
