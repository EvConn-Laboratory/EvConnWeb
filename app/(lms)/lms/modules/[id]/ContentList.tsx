"use client";

import { motion } from "framer-motion";
import {
  FileText,
  PlayCircle,
  ExternalLink,
  ClipboardList,
  Download,
  Presentation,
} from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations/variants";
import { cn } from "@/lib/utils";
import { AssignmentPanel } from "./AssignmentPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentItemProps {
  id: string;
  type: string;
  title: string;
  contentData: string;
  orderIndex: number;
  isPublished: boolean;
  assignment?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    format: string;
    maxScore: string;
    deadline: string | null;
    allowResubmit: boolean;
    isRequired: boolean;
    gracePeriodHours: number;
    questions?: Array<{
      id: string;
      questionText: string;
      orderIndex: number;
      points: string;
      options: Array<{ id: string; optionText: string; orderIndex: number }>;
    }>;
    submission?: {
      id: string;
      status: string;
      submittedAt: string;
      textAnswer: string | null;
      filePath: string | null;
      isLate: boolean;
      version: number;
    } | null;
    grade?: {
      score: string;
      comment: string | null;
      gradedAt: string;
    } | null;
  };
}

// ─── Material items (PDF / Slides) ───────────────────────────────────────────

function MaterialItem({
  item,
  index,
}: {
  item: ContentItemProps;
  index: number;
}) {
  let url = "#";
  try {
    const data = JSON.parse(item.contentData) as { url?: string };
    url = data.url ?? "#";
  } catch {
    // fallback
  }

  const isPdf = item.type === "pdf_material";

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isPdf
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        )}
      >
        {isPdf ? (
          <FileText className="h-5 w-5" />
        ) : (
          <Presentation className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {isPdf ? "PDF Document" : "Slide Material"}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          url !== "#"
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        <Download className="h-3.5 w-3.5" />
        {isPdf ? "Open PDF" : "Open Slide"}
      </a>
    </motion.div>
  );
}

// ─── Video embed item ─────────────────────────────────────────────────────────

function VideoItem({
  item,
  index,
}: {
  item: ContentItemProps;
  index: number;
}) {
  let embedUrl = "";
  try {
    const data = JSON.parse(item.contentData) as {
      embedUrl?: string;
      url?: string;
    };
    embedUrl = data.embedUrl ?? data.url ?? "";
  } catch {
    // fallback
  }

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <PlayCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground">Video</p>
        </div>
      </div>
      {embedUrl ? (
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title={item.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          Video URL not available.
        </div>
      )}
    </motion.div>
  );
}

// ─── External link item ───────────────────────────────────────────────────────

function ExternalLinkItem({
  item,
  index,
}: {
  item: ContentItemProps;
  index: number;
}) {
  let url = "#";
  let label = "Open Link";
  try {
    const data = JSON.parse(item.contentData) as {
      url?: string;
      label?: string;
    };
    url = data.url ?? "#";
    label = data.label ?? "Open Link";
  } catch {
    // fallback
  }

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
        <ExternalLink className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{url}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-500/20 dark:text-cyan-400"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {label}
      </a>
    </motion.div>
  );
}

// ─── Content item dispatcher ──────────────────────────────────────────────────

function ContentItemRenderer({
  item,
  index,
}: {
  item: ContentItemProps;
  index: number;
}) {
  switch (item.type) {
    case "pdf_material":
    case "slide_material":
      return <MaterialItem item={item} index={index} />;

    case "video_embed":
      return <VideoItem item={item} index={index} />;

    case "external_link":
      return <ExternalLinkItem item={item} index={index} />;

    case "assignment_reference":
      if (!item.assignment) {
        // Assignment not found or not published
        return null;
      }
      return (
        <motion.div variants={fadeUp} custom={index}>
          <AssignmentPanel assignment={item.assignment} />
        </motion.div>
      );

    default:
      return null;
  }
}

// ─── Main exported component ──────────────────────────────────────────────────

export function ContentList({ items }: { items: ContentItemProps[] }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <h2 className="text-base font-semibold text-foreground">Module Content</h2>
      {items.map((item, i) => (
        <ContentItemRenderer key={item.id} item={item} index={i} />
      ))}
    </motion.div>
  );
}
