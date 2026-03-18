"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { createGenerationAction } from "@/lib/actions/personnel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddGenerationForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createGenerationAction(null, formData);
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
        Add Generation
      </Button>

      {open && (
        <form
          action={handleSubmit}
          className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-semibold text-foreground">New Generation</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Gen #</label>
              <input
                name="number"
                type="number"
                min={1}
                required
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                placeholder="e.g. 12"
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
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                placeholder="2024"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Name</label>
            <input
              name="name"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="e.g. Luminary"
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
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              placeholder="Leave blank if current"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input type="checkbox" name="isActive" value="true" className="rounded" />
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
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
