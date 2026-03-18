import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pin,
  Lock,
  MessageSquare,
  Eye,
  Clock,
  MessagesSquare,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getThreadsByModuleAction } from "@/lib/actions/phase2";
import { getModuleByIdAction } from "@/lib/actions/modules";
import { cn } from "@/lib/utils";
import { NewThreadForm } from "./NewThreadForm";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const module = await getModuleByIdAction(id);
  return {
    title: module ? `Diskusi — ${module.title}` : "Diskusi Forum",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (diffDays > 0) return `${diffDays} hari lalu`;
  if (diffHours > 0) return `${diffHours} jam lalu`;
  if (diffMins > 0) return `${diffMins} menit lalu`;
  return "Baru saja";
}

// ─── Thread Card ──────────────────────────────────────────────────────────────

type Thread = Awaited<ReturnType<typeof getThreadsByModuleAction>>[number];

function ThreadCard({
  thread,
  moduleId,
}: {
  thread: Thread;
  moduleId: string;
}) {
  return (
    <Link
      href={`/lms/modules/${moduleId}/discussion/${thread.id}`}
      className="group block"
    >
      <div
        className={cn(
          "rounded-2xl border bg-card p-4 transition-all hover:shadow-md",
          thread.isPinned
            ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
            : "border-border hover:border-border/80",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Pinned dot */}
          <div
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              thread.isPinned ? "bg-primary" : "bg-muted-foreground/25",
            )}
          />

          <div className="min-w-0 flex-1">
            {/* Badges */}
            {(thread.isPinned || thread.isLocked) && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {thread.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Pin className="h-3 w-3" />
                    Disematkan
                  </span>
                )}
                {thread.isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Dikunci
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {thread.title}
            </h3>

            {/* Author + date */}
            <p className="mt-1 text-xs text-muted-foreground">
              Oleh{" "}
              <span className="font-medium text-foreground/70">
                {thread.authorName}
              </span>{" "}
              &bull; {formatRelativeTime(thread.createdAt)}
            </p>
          </div>

          {/* Stats */}
          <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {thread.replyCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {thread.viewCount}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(thread.lastActivityAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const [module, threads] = await Promise.all([
    getModuleByIdAction(id),
    getThreadsByModuleAction(id),
  ]);

  if (!module) notFound();

  const isStaff =
    session.user.role === "assistant" || session.user.role === "super_admin";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/lms/modules/${id}`}
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Modul</span>
        </Link>
        <span>/</span>
        <span className="max-w-[200px] truncate text-foreground">
          {module.title}
        </span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Diskusi Forum
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {threads.length} thread &bull;{" "}
            <span className="font-medium text-foreground/70">
              {module.title}
            </span>
          </p>
        </div>
        <NewThreadForm moduleId={id} isStaff={isStaff} />
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <MessagesSquare className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Belum ada diskusi
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Jadilah yang pertama memulai diskusi pada modul ini!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} moduleId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
