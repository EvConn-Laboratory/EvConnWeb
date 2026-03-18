"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { updateNewsArticleAction, getNewsArticleByIdAction } from "@/lib/actions/cms";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function EditNewsArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [thumbnailPath, setThumbnailPath] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await getNewsArticleByIdAction(params.id);
        if ("error" in result) {
          setError(result.error);
        } else if (result.data) {
          const a = result.data;
          setTitle(a.title);
          setSlug(a.slug);
          setContent(a.content);
          setStatus(a.status as "draft" | "published");
          setThumbnailPath(a.thumbnailPath ?? "");
        }
      } catch {
        setError("Gagal memuat artikel.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [params.id]);

  function handleSave(targetStatus: "draft" | "published") {
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("content", content);
    formData.set("status", targetStatus);
    if (thumbnailPath) formData.set("thumbnailPath", thumbnailPath);

    startTransition(async () => {
      const result = await updateNewsArticleAction(params.id, null, formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setStatus(targetStatus);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/cms/news"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Kembali
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Edit Artikel
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {status === "published" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("draft")}
              disabled={isPending}
              className="gap-1.5"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Jadikan Draft
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => handleSave(status === "published" ? "published" : "draft")}
            disabled={isPending}
            variant="outline"
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Simpan Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("published")}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Terbitkan
          </Button>
        </div>
      </div>

      {/* Status/feedback banners */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          Artikel berhasil disimpan.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Judul Artikel
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              placeholder="Masukkan judul artikel..."
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Konten</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Tulis konten artikel di sini..."
            />
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Pengaturan Artikel
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-medium">
                Slug URL
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="url-artikel"
                className="h-9 font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                /news/<span className="text-foreground">{slug || "url-artikel"}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="thumbnail" className="text-xs font-medium">
                Thumbnail URL (opsional)
              </Label>
              <Input
                id="thumbnail"
                value={thumbnailPath}
                onChange={(e) => setThumbnailPath(e.target.value)}
                placeholder="/storage/cms/news/..."
                className="h-9 text-xs"
              />
            </div>

            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Status:{" "}
                <span
                  className={
                    status === "published"
                      ? "font-medium text-green-600 dark:text-green-400"
                      : "font-medium text-amber-600 dark:text-amber-400"
                  }
                >
                  {status === "published" ? "Diterbitkan" : "Draft"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
