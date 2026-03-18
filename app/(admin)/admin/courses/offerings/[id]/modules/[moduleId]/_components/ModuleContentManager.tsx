"use client";

import { useState, useTransition, useRef } from "react";
import {
  Plus,
  AlertCircle,
  FileText,
  Presentation,
  Video,
  Link2,
  ClipboardList,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  FileEdit,
  Archive,
  Settings,
  Upload,
  Loader2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContentItemAction,
  deleteContentItemAction,
  toggleContentItemPublishedAction,
  updateModuleAction,
} from "@/lib/actions/modules";
import { AssignmentsManager } from "./AssignmentsManager";
import type { AssignmentWithQuestions } from "./AssignmentsManager";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType =
  | "pdf_material"
  | "slide_material"
  | "video_embed"
  | "external_link"
  | "assignment_reference";

interface ContentItem {
  id: string;
  type: string;
  title: string;
  contentData: string;
  orderIndex: number;
  isPublished: boolean;
}

interface ModuleData {
  id: string;
  offeringId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: string;
  openDatetime: Date | null;
  closeDatetime: Date | null;
  manualOverride: string | null;
}

interface Props {
  module: ModuleData;
  contentItems: ContentItem[];
  assignments: AssignmentWithQuestions[];
  offeringId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none dark:bg-input/30";

const MODULE_STATUS: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border", Icon: FileEdit },
  scheduled: { label: "Scheduled", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", Icon: Clock },
  open: { label: "Open", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", Icon: CheckCircle2 },
  closed: { label: "Closed", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20", Icon: Archive },
};

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ElementType; color: string }> = {
  pdf_material:         { label: "PDF Material",          icon: FileText,      color: "text-red-500" },
  slide_material:       { label: "Slide / Presentation",  icon: Presentation,  color: "text-orange-500" },
  video_embed:          { label: "Video Embed",            icon: Video,         color: "text-blue-500" },
  external_link:        { label: "External Link",          icon: Link2,         color: "text-teal-500" },
  assignment_reference: { label: "Assignment Reference",   icon: ClipboardList, color: "text-violet-500" },
};

function toIsoLocal(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// ─── Module Settings Editor ───────────────────────────────────────────────────

function ModuleSettingsPanel({ module, offeringId }: { module: ModuleData; offeringId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description ?? "");
  const [status, setStatus] = useState(module.status);
  const [openDt, setOpenDt] = useState(toIsoLocal(module.openDatetime));
  const [closeDt, setCloseDt] = useState(toIsoLocal(module.closeDatetime));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const boundUpdate = updateModuleAction.bind(null, module.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("status", status);
    if (openDt) fd.append("openDatetime", openDt);
    if (closeDt) fd.append("closeDatetime", closeDt);

    startTransition(async () => {
      const res = await boundUpdate(null, fd);
      if ("error" in res) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const statusCfg = MODULE_STATUS[module.status] ?? MODULE_STATUS.draft;
  const StatusIcon = statusCfg.Icon;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/20"
      >
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Module Settings</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", statusCfg.className)}>
            <StatusIcon className="h-2.5 w-2.5" />
            {statusCfg.label}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="mod-title">Title</Label>
                <Input id="mod-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="mod-desc">
                  Description{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="mod-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief overview" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-status">Status</Label>
                <select id="mod-status" value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLASS}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                {/* spacer */}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-open">
                  Opens At{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="mod-open" type="datetime-local" value={openDt} onChange={(e) => setOpenDt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-close">
                  Closes At{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="mod-close" type="datetime-local" value={closeDt} onChange={(e) => setCloseDt(e.target.value)} />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}
            {saved && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Settings saved.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── File Upload Helper ───────────────────────────────────────────────────────

function FileUploadField({
  onUploaded,
  accept,
  label,
}: {
  onUploaded: (filePath: string, fileSize: number, fileName: string) => void;
  accept: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "materials");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onUploaded(json.filePath, json.fileSize, json.fileName);
      setUploadedName(json.fileName);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm transition-colors hover:border-ring hover:bg-muted/20",
          uploading && "opacity-60 cursor-not-allowed",
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">
          {uploading ? "Uploading..." : uploadedName ?? label}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploadError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" /> {uploadError}
        </p>
      )}
    </div>
  );
}

// ─── Add Content Item Form ────────────────────────────────────────────────────

function AddContentItemForm({
  moduleId,
  nextOrder,
  assignments,
  onCreated,
}: {
  moduleId: string;
  nextOrder: number;
  assignments: Assignment[];
  onCreated: (item: ContentItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>("pdf_material");
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState(String(nextOrder));
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Type-specific fields
  const [filePath, setFilePath] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [pageCount, setPageCount] = useState("");
  const [slideCount, setSlideCount] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [url, setUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id ?? "");

  function reset() {
    setTitle(""); setOrderIndex(String(nextOrder)); setIsPublished(false); setError(null);
    setFilePath(""); setFileSize(0); setPageCount(""); setSlideCount("");
    setEmbedUrl(""); setDurationSeconds(""); setUrl(""); setAssignmentId(assignments[0]?.id ?? "");
  }

  function buildContentData(): string {
    switch (type) {
      case "pdf_material":
        return JSON.stringify({ file_path: filePath, file_size: fileSize || undefined, page_count: pageCount ? Number(pageCount) : undefined });
      case "slide_material":
        return JSON.stringify({ file_path: filePath, file_size: fileSize || undefined, slide_count: slideCount ? Number(slideCount) : undefined });
      case "video_embed":
        return JSON.stringify({ embed_url: embedUrl, duration_seconds: durationSeconds ? Number(durationSeconds) : undefined });
      case "external_link":
        return JSON.stringify({ url, open_in_new_tab: openInNewTab });
      case "assignment_reference":
        return JSON.stringify({ assignment_id: assignmentId });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required"); return; }
    if ((type === "pdf_material" || type === "slide_material") && !filePath) {
      setError("File path or upload is required"); return;
    }
    if (type === "video_embed" && !embedUrl) { setError("Embed URL is required"); return; }
    if (type === "external_link" && !url) { setError("URL is required"); return; }
    if (type === "assignment_reference" && !assignmentId) { setError("Select an assignment"); return; }

    const fd = new FormData();
    fd.append("moduleId", moduleId);
    fd.append("type", type);
    fd.append("title", title.trim());
    fd.append("contentData", buildContentData());
    fd.append("orderIndex", orderIndex);
    fd.append("isPublished", String(isPublished));

    startTransition(async () => {
      const res = await createContentItemAction(null, fd);
      if ("error" in res) { setError(res.error); return; }
      onCreated({
        id: res.id ?? crypto.randomUUID(),
        type,
        title: title.trim(),
        contentData: buildContentData(),
        orderIndex: Number(orderIndex),
        isPublished,
      });
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Add Content Item
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Add Content Item</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div className="space-y-1.5">
          <Label htmlFor="ci-type">Content Type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((t) => {
              const cfg = CONTENT_TYPE_CONFIG[t];
              const Icon = cfg.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center text-xs font-medium transition-colors",
                    type === t
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className={cn("h-4 w-4", type === t && cfg.color)} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Common: title + order + published */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ci-title">Title</Label>
            <Input id="ci-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Module 1 Slides" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-order">Order</Label>
            <Input id="ci-order" type="number" min={0} value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-foreground">Publish immediately</span>
            </label>
          </div>
        </div>

        {/* Type-specific fields */}
        {(type === "pdf_material" || type === "slide_material") && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Upload File</Label>
              <FileUploadField
                accept={type === "pdf_material" ? ".pdf,application/pdf" : ".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"}
                label={type === "pdf_material" ? "Click to upload PDF" : "Click to upload PDF or Presentation"}
                onUploaded={(path, size) => { setFilePath(path); setFileSize(size); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ci-filepath">
                Or enter file path manually{" "}
                <span className="text-xs text-muted-foreground font-normal">(optional if uploaded)</span>
              </Label>
              <Input
                id="ci-filepath"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="/uploads/materials/2026/01/file.pdf"
              />
            </div>
            {type === "pdf_material" ? (
              <div className="space-y-1.5">
                <Label htmlFor="ci-pages">
                  Page Count{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="ci-pages" type="number" min={1} value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="e.g. 12" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ci-slides">
                  Slide Count{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="ci-slides" type="number" min={1} value={slideCount} onChange={(e) => setSlideCount(e.target.value)} placeholder="e.g. 20" />
              </div>
            )}
          </div>
        )}

        {type === "video_embed" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ci-embed">Embed URL</Label>
              <Input id="ci-embed" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ci-duration">
                Duration (seconds){" "}
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="ci-duration" type="number" min={0} value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} placeholder="e.g. 300" />
            </div>
          </div>
        )}

        {type === "external_link" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ci-url">URL</Label>
              <Input id="ci-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-foreground">Open in new tab</span>
            </label>
          </div>
        )}

        {type === "assignment_reference" && (
          <div className="space-y-1.5">
            <Label htmlFor="ci-assignment">Assignment</Label>
            {assignments.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No assignments in this module yet. Create an assignment first.
              </p>
            ) : (
              <select id="ci-assignment" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className={SELECT_CLASS}>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.type.replace("_", " ")} · {a.format})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => { reset(); setOpen(false); }}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Content Item Row ─────────────────────────────────────────────────────────

function ContentItemRow({
  item,
  onTogglePublished,
  onDelete,
}: {
  item: ContentItem;
  onTogglePublished: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = CONTENT_TYPE_CONFIG[item.type as ContentType];
  const Icon = cfg?.icon ?? FileText;
  const color = cfg?.color ?? "text-muted-foreground";

  let summary = "";
  try {
    const data = JSON.parse(item.contentData);
    if (item.type === "pdf_material" || item.type === "slide_material") {
      summary = data.file_path ?? "";
    } else if (item.type === "video_embed") {
      summary = data.embed_url ?? "";
    } else if (item.type === "external_link") {
      summary = data.url ?? "";
    } else if (item.type === "assignment_reference") {
      summary = `Assignment ID: ${data.assignment_id}`;
    }
  } catch {
    summary = "";
  }

  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/20">
      {/* Drag handle placeholder */}
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />

      {/* Order */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-muted-foreground">
        {item.orderIndex + 1}
      </div>

      {/* Type icon */}
      <div className={cn("shrink-0", color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        {summary && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{summary}</p>
        )}
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">{cfg?.label ?? item.type}</p>
      </div>

      {/* Published badge */}
      <span className={cn(
        "shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        item.isPublished
          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
          : "bg-muted text-muted-foreground border-border",
      )}>
        {item.isPublished ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
        {item.isPublished ? "Published" : "Draft"}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          disabled={toggling}
          onClick={() => startToggle(async () => {
            const res = await toggleContentItemPublishedAction(item.id, !item.isPublished);
            if ("success" in res) onTogglePublished(item.id, !item.isPublished);
          })}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          title={item.isPublished ? "Unpublish" : "Publish"}
        >
          {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : item.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          disabled={deleting}
          onClick={() => {
            if (!confirm(`Delete "${item.title}"?`)) return;
            startDelete(async () => {
              const res = await deleteContentItemAction(item.id);
              if ("success" in res) onDelete(item.id);
            });
          }}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
          title="Delete"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ModuleContentManager({ module, contentItems: initialItems, assignments, offeringId }: Props) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  // Derive a flat assignment list for the assignment_reference picker (keeps in sync with AssignmentsManager state via shared key)
  const assignmentRefs = assignments.map((a) => ({ id: a.id, title: a.title, type: a.type, format: a.format }));

  function handleTogglePublished(id: string, val: boolean) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, isPublished: val } : item));
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleCreated(item: ContentItem) {
    setItems((prev) => [...prev, item].sort((a, b) => a.orderIndex - b.orderIndex));
  }

  const publishedCount = items.filter((i) => i.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Module settings */}
      <ModuleSettingsPanel module={module} offeringId={offeringId} />

      {/* Assignments section */}
      <AssignmentsManager
        moduleId={module.id}
        initialAssignments={assignments}
      />

      {/* Content items section */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Content Items</h2>
            <p className="text-xs text-muted-foreground">
              {items.length === 0
                ? "No content items yet"
                : `${items.length} item${items.length !== 1 ? "s" : ""} · ${publishedCount} published`}
            </p>
          </div>
          <AddContentItemForm
            moduleId={module.id}
            nextOrder={items.length}
            assignments={assignmentRefs}
            onCreated={handleCreated}
          />
        </div>

        {/* Items list */}
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No content yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add PDFs, slides, videos, links, or assignment references to this module.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <ContentItemRow
                key={item.id}
                item={item}
                onTogglePublished={handleTogglePublished}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content type legend */}
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content Types</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.entries(CONTENT_TYPE_CONFIG) as [ContentType, typeof CONTENT_TYPE_CONFIG[ContentType]][]).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={type} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                {cfg.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
