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

// ─── Add Gallery Item Form ────────────────────────────────────────────────────

export function AddGalleryItemForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createGalleryItemAction(null, formData);
      if ("error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  if (!open) {
    return (
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Tambah Item
      </Button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="w-80 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-foreground">Tambah Item Gallery</p>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">File Path / URL</label>
        <input
          name="filePath"
          required
          placeholder="/images/gallery/photo.jpg"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          Judul <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          name="title"
          placeholder="Judul foto..."
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          Deskripsi <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="Deskripsi singkat..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Urutan</label>
        <input
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={0}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
        <input type="checkbox" name="isPublished" value="true" defaultChecked className="rounded" />
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
          {isPending ? "Menyimpan…" : "Tambah"}
        </button>
      </div>
    </form>
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
      if ("error" in res) { setError(res.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus item "${item.title ?? item.filePath}"? Tidak bisa dibatalkan.`)) return;
    startDelete(async () => {
      const res = await deleteGalleryItemAction(item.id);
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
            <p className="text-xs font-semibold text-foreground">Edit Item</p>
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Judul <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="title"
              defaultValue={item.title ?? ""}
              placeholder="Judul foto..."
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Deskripsi <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={item.description ?? ""}
              placeholder="Deskripsi singkat..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Urutan</label>
            <input
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={item.sortOrder}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
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
