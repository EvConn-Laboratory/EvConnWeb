"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2 } from "lucide-react";
import { updateOfferingAction, deleteOfferingAction } from "@/lib/actions/courses";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface OfferingData {
  id: string;
  semester: string;
  academicYear: string;
  hari: string | null;
  shift: string | null;
  status: "draft" | "active" | "closed" | "archived";
  visibility: "internal" | "public";
  enrollmentKey: string | null;
}

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none dark:bg-input/30";

export function EditOfferingForm({ offering }: { offering: OfferingData }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateOfferingAction(offering.id, null, formData);
      if ("error" in res) { setError(res.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this offering? This cannot be undone.")) return;
    startDelete(async () => {
      const res = await deleteOfferingAction(offering.id);
      if ("error" in res) { setError(res.error); setOpen(true); return; }
      router.push("/admin/courses");
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:border-red-800 dark:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
        <button
          onClick={() => { setOpen((v) => !v); setError(null); }}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Offering
        </button>
      </div>

      {open && (
        <form
          action={handleSubmit}
          className="w-96 space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-foreground">Edit Offering</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Semester</label>
              <input
                name="semester"
                required
                defaultValue={offering.semester}
                placeholder="e.g. Ganjil"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Academic Year</label>
              <input
                name="academicYear"
                required
                defaultValue={offering.academicYear}
                placeholder="e.g. 2024/2025"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Day <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="hari"
                defaultValue={offering.hari ?? ""}
                placeholder="e.g. Senin"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Shift <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="shift"
                defaultValue={offering.shift ?? ""}
                placeholder="e.g. Pagi"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Status</label>
              <select name="status" defaultValue={offering.status} className={SELECT_CLASS}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Visibility</label>
              <select name="visibility" defaultValue={offering.visibility} className={SELECT_CLASS}>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Enrollment Key <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="enrollmentKey"
              defaultValue={offering.enrollmentKey ?? ""}
              placeholder="Leave blank for no key"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
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
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
