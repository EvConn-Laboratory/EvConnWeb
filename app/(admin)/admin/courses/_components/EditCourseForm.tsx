"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2 } from "lucide-react";
import { updateCourseAction, deleteCourseAction } from "@/lib/actions/courses";
import { cn } from "@/lib/utils";

interface CourseRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: "praktikum" | "study_group";
  isActive: boolean;
}

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none dark:bg-input/30";

export function EditCourseForm({ course }: { course: CourseRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateCourseAction(course.id, null, formData);
      if ("error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Deactivate course "${course.name}"? It will be marked inactive.`)) return;
    startDelete(async () => {
      const res = await deleteCourseAction(course.id);
      if ("error" in res) { setError(res.error); setOpen(true); return; }
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => { setOpen((v) => !v); setError(null); }}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>

      {open && (
        <form
          action={handleSubmit}
          className="w-80 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Edit Course</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "…" : "Deactivate"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Code</label>
              <input
                name="code"
                required
                defaultValue={course.code}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Type</label>
              <select name="type" defaultValue={course.type} className={SELECT_CLASS}>
                <option value="praktikum">Practicum</option>
                <option value="study_group">Study Group</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Name</label>
            <input
              name="name"
              required
              defaultValue={course.name}
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
              defaultValue={course.description ?? ""}
              placeholder="Short description..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={course.isActive}
              className="rounded"
            />
            Active
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
