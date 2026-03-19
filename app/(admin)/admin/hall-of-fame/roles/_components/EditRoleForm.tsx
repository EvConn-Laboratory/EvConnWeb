"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2 } from "lucide-react";
import { updateOrgRoleAction, deleteOrgRoleAction } from "@/lib/actions/personnel";
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

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export function EditRoleForm({ role }: { role: RoleRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateOrgRoleAction(role.id, null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteOrgRoleAction(role.id);
      if (res && "error" in res) {
        setError(res.error);
        setOpen(true);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" className="gap-1">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Role</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {isDeleting ? "..." : "Delete"}
              </Button>
            </div>
            <DialogDescription>
              Update organizational role details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Role Name</label>
              <input
                name="name"
                required
                defaultValue={role.name}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Head of Lab"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={role.description ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                placeholder="Short description..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Sort Order</label>
              <input
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={role.sortOrder}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
