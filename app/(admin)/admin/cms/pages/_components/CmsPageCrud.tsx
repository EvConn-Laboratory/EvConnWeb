"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { upsertCmsPageAction, deleteCmsPageAction } from "@/lib/actions/cms";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Add Page Form ────────────────────────────────────────────────────────────

export function AddCmsPageForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertCmsPageAction(null, formData);
      if ("error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  if (!open) {
    return (
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Tambah Halaman
      </Button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="w-96 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-foreground">Tambah Halaman</p>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Slug</label>
        <input
          name="slug"
          required
          placeholder="e.g. about, contact"
          pattern="[a-z0-9-]+"
          title="Lowercase letters, numbers, and hyphens only"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground font-mono"
        />
        <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Judul</label>
        <input
          name="title"
          required
          placeholder="Judul halaman..."
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          Konten <span className="text-muted-foreground">(HTML/Markdown)</span>
        </label>
        <textarea
          name="content"
          rows={6}
          placeholder="Konten halaman..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
        <input type="checkbox" name="isPublished" value="true" className="rounded" />
        Langsung diterbitkan
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
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground",
            isPending && "opacity-60",
          )}
        >
          {isPending ? "Menyimpan…" : "Buat Halaman"}
        </button>
      </div>
    </form>
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
      if ("error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus halaman "${page.slug}"? Tidak bisa dibatalkan.`)) return;
    startDelete(async () => {
      const res = await deleteCmsPageAction(page.id);
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
          className="w-96 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Edit Halaman</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "…" : "Hapus"}
            </button>
          </div>

          {/* slug is used for upsert lookup – keep it consistent */}
          <input type="hidden" name="slug" value={page.slug} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Slug</label>
            <div className="flex h-9 w-full items-center rounded-lg border border-border bg-muted px-3 text-sm font-mono text-muted-foreground">
              /{page.slug}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Judul</label>
            <input
              name="title"
              required
              defaultValue={page.title}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Konten</label>
            <textarea
              name="content"
              rows={8}
              defaultValue={page.content}
              placeholder="Konten halaman..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y font-mono"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={page.isPublished}
              className="rounded"
            />
            Diterbitkan
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
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground",
                isPending && "opacity-60",
              )}
            >
              {isPending ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
