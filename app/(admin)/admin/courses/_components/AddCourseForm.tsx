"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createCourseAction } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddCourseForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createCourseAction(null, formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }

      setSuccess("Course added successfully.");
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-3.5 w-3.5" />
        Add Course
      </Button>

      {open && (
        <form
          action={handleSubmit}
          className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-semibold text-foreground">New Course</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Course Name</label>
            <input
              name="name"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="e.g. Computer Networks"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Code</label>
            <input
              name="code"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="e.g. TKC301"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Type</label>
            <select
              name="type"
              defaultValue="praktikum"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="praktikum">Practicum</option>
              <option value="study_group">Study Group</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Short course summary"
            />
          </div>

          <input type="hidden" name="isActive" value="true" />

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
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

      {success && (
        <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {success}
        </p>
      )}
    </div>
  );
}
