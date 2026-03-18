"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2, Star } from "lucide-react";
import {
  updateGenerationAction,
  deleteGenerationAction,
  setActiveGenerationAction,
} from "@/lib/actions/personnel";
import { Button } from "@/components/ui/button";
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

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateGenerationAction(generation.id, null, formData);
      if ("error" in res) {
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
      if ("error" in res) {
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
    <div className="flex flex-col items-end gap-2">
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
        <Button
          variant="outline"
          size="xs"
          className="gap-1"
          onClick={() => { setOpen((v) => !v); setError(null); }}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </div>

      {open && (
        <form
          action={handleSubmit}
          className="w-72 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Edit — G{generation.number}</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "…" : "Delete"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Gen #</label>
              <input
                name="number"
                type="number"
                min={1}
                required
                defaultValue={generation.number}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
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
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Name</label>
            <input
              name="name"
              required
              defaultValue={generation.name}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
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
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={generation.isActive}
              className="rounded"
            />
            Mark as active generation
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
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
