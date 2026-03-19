"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2, Star } from "lucide-react";
import {
  updateGenerationAction,
  deleteGenerationAction,
  setActiveGenerationAction,
} from "@/lib/actions/personnel";
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

interface GenerationRow {
  id: string;
  number: number;
  name: string;
  startYear: number;
  endYear: number | null;
  description: string | null;
  isActive: boolean;
}

export function EditGenerationForm({ generation }: { generation: GenerationRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isActivating, startActivate] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateGenerationAction(generation.id, null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete generation "${generation.name}"? This cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteGenerationAction(generation.id);
      if (res && "error" in res) {
        setError(res.error);
        setOpen(false);
        return;
      }
      window.location.reload();
    });
  }

  function handleSetActive() {
    if (!confirm(`Set G${generation.number} "${generation.name}" as the active generation?`)) return;
    startActivate(async () => {
      await setActiveGenerationAction(generation.id);
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {!generation.isActive && (
        <Button
          variant="ghost"
          size="xs"
          className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
          onClick={handleSetActive}
          disabled={isActivating}
          title="Set as active generation"
        >
          <Star className="h-3 w-3" />
          {isActivating ? "…" : "Set Active"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="xs" className="gap-1">
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form action={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Edit G{generation.number}</DialogTitle>
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
                Update the information for this generation.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Gen #</label>
                  <input
                    name="number"
                    type="number"
                    min={1}
                    required
                    defaultValue={generation.number}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Start Year</label>
                  <input
                    name="startYear"
                    type="number"
                    min={2000}
                    max={2100}
                    required
                    defaultValue={generation.startYear}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Name</label>
                <input
                  name="name"
                  required
                  defaultValue={generation.name}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  End Year <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  name="endYear"
                  type="number"
                  min={2000}
                  max={2100}
                  defaultValue={generation.endYear ?? ""}
                  placeholder="Leave blank if current"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={generation.description ?? ""}
                  placeholder="Short description..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={generation.isActive}
                  className="rounded border-border"
                />
                Mark as active generation
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
                {isPending ? "Saving..." : "Update Generation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
