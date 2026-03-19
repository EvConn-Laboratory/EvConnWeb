"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { upsertCmsPageAction, deleteCmsPageAction } from "@/lib/actions/cms";
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

// ─── Add Page Form ────────────────────────────────────────────────────────────

export function AddCmsPageForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertCmsPageAction(null, formData);
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
          Add Page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add CMS Page</DialogTitle>
            <DialogDescription>
              Create a new custom page with HTML or Markdown content.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">Slug</label>
              <input
                name="slug"
                required
                placeholder="e.g. about, contact"
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">Title</label>
              <input
                name="title"
                required
                placeholder="Page title..."
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block text-left">
                Content <span className="text-muted-foreground font-normal">(HTML/Markdown)</span>
              </label>
              <textarea
                name="content"
                rows={10}
                placeholder="Page content..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input type="checkbox" id="cms-pub" name="isPublished" value="true" className="h-4 w-4 rounded border-input accent-primary" />
              <label htmlFor="cms-pub" className="font-medium cursor-pointer">Publish immediately</label>
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
              {isPending ? "Saving..." : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Page Form ───────────────────────────────────────────────────────────

interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
}

export function EditCmsPageForm({ page }: { page: CmsPageRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertCmsPageAction(null, formData);
      if (res && "error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete page "${page.slug}"? This action cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteCmsPageAction(page.id);
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
      <DialogContent className="sm:max-w-xl">
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
              <DialogTitle>Edit Page</DialogTitle>
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
              Update page details and content.
            </DialogDescription>
          </DialogHeader>

          {/* slug is used for upsert lookup – keep it consistent */}
          <input type="hidden" name="slug" value={page.slug} />

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground block">Slug</label>
              <div className="flex h-9 w-full items-center rounded-lg border border-border bg-muted px-3 text-sm font-mono text-muted-foreground">
                /{page.slug}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground block">Title</label>
              <input
                name="title"
                required
                defaultValue={page.title}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground block">Content</label>
              <textarea
                name="content"
                rows={12}
                defaultValue={page.content}
                placeholder="Page content..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                id="cms-pub-edit"
                name="isPublished"
                value="true"
                defaultChecked={page.isPublished}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="cms-pub-edit" className="font-medium cursor-pointer">Published</label>
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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
