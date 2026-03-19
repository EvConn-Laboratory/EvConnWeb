"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2 } from "lucide-react";
import { updateCourseAction, deleteCourseAction } from "@/lib/actions/courses";
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

interface CourseRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: "praktikum" | "study_group";
  isActive: boolean;
}

export function EditCourseForm({ course }: { course: CourseRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateCourseAction(course.id, null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Deactivate course "${course.name}"? It will be marked inactive.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteCourseAction(course.id);
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
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Course</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {isDeleting ? "..." : "Deactivate"}
              </Button>
            </div>
            <DialogDescription>
              Update course details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Code</label>
                <input
                  name="code"
                  required
                  defaultValue={course.code}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Type</label>
                <select
                  name="type"
                  defaultValue={course.type}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="praktikum">Practicum</option>
                  <option value="study_group">Study Group</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Name</label>
              <input
                name="name"
                required
                defaultValue={course.name}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={course.description ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                placeholder="Short description..."
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={course.isActive}
                className="rounded border-border"
              />
              Course is active
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
              {isPending ? "Saving..." : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
