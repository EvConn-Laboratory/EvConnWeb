"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { createOrgRoleAction } from "@/lib/actions/personnel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddRoleForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createOrgRoleAction(null, formData);
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
        Add Role
      </Button>

      {open && (
        <form
          action={handleSubmit}
          className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-semibold text-foreground">New Organizational Role</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Role Name</label>
            <input
              name="name"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="e.g. Head of Lab"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Brief description of this role"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Sort Order</label>
            <input
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={0}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>

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
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
