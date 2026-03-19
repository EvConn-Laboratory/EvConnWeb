"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2 } from "lucide-react";
import { updateOfferingAction, deleteOfferingAction } from "@/lib/actions/courses";
import { useRouter } from "next/navigation";
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

export function EditOfferingForm({ offering }: { offering: OfferingData }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateOfferingAction(offering.id, null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this offering? This cannot be undone.")) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteOfferingAction(offering.id);
      if (res && "error" in res) {
        setError(res.error);
        setOpen(true);
        return;
      }
      router.push("/admin/courses");
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit Offering
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Offering</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
            <DialogDescription>
              Update offering details for this course.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Semester</label>
                <input
                  name="semester"
                  required
                  defaultValue={offering.semester}
                  placeholder="e.g. Ganjil"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Academic Year</label>
                <input
                  name="academicYear"
                  required
                  defaultValue={offering.academicYear}
                  placeholder="e.g. 2024/2025"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">
                  Day <span className="text-muted-foreground text-left block">(optional)</span>
                </label>
                <input
                  name="hari"
                  defaultValue={offering.hari ?? ""}
                  placeholder="e.g. Senin"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">
                  Shift <span className="text-muted-foreground text-left block">(optional)</span>
                </label>
                <input
                  name="shift"
                  defaultValue={offering.shift ?? ""}
                  placeholder="e.g. Pagi"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Status</label>
                <select
                  name="status"
                  defaultValue={offering.status}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Visibility</label>
                <select
                  name="visibility"
                  defaultValue={offering.visibility}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Enrollment Key <span className="text-muted-foreground text-left block">(optional)</span>
              </label>
              <input
                name="enrollmentKey"
                defaultValue={offering.enrollmentKey ?? ""}
                placeholder="Leave blank for no key"
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
