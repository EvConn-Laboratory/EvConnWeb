"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import {
  createGalleryItemAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
} from "@/lib/actions/cms";
import { cn } from "@/lib/utils";
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

// ─── Add Gallery Item Form ────────────────────────────────────────────────────

export function AddGalleryItemForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createGalleryItemAction(null, formData);
      if (res && "error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Gallery Item</DialogTitle>
            <DialogDescription>
              Add a new photo or media item to the gallery.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">File Path / URL</label>
              <input
                name="filePath"
                required
                placeholder="/images/gallery/photo.jpg"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">
                Title <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                name="title"
                placeholder="Item title..."
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Short description..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block text-left">Order</label>
                <input
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="ci-pub" name="isPublished" value="true" defaultChecked className="h-4 w-4 rounded border-input accent-primary" />
                <label htmlFor="ci-pub" className="text-xs font-medium text-foreground cursor-pointer">Published</label>
              </div>
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
              {isPending ? "Saving..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Gallery Item Form ───────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  filePath: string;
  sortOrder: number;
  isPublished: boolean;
}

export function EditGalleryItemForm({ item }: { item: GalleryItem }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateGalleryItemAction(item.id, null, formData);
      if (res && "error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete item "${item.title ?? item.filePath}"? This action cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteGalleryItemAction(item.id);
      if (res && "error" in res) { setError(res.error); setOpen(true); return; }
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="xs" variant="outline" className="h-7 gap-1">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
              <DialogTitle>Edit Gallery Item</DialogTitle>
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
              Update the details for this gallery item.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">
                Title <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                name="title"
                defaultValue={item.title ?? ""}
                placeholder="Item title..."
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                defaultValue={item.description ?? ""}
                placeholder="Short description..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">Order</label>
              <input
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={item.sortOrder}
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
