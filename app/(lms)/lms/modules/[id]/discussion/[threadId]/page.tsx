import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Eye } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getThreadsByModuleAction, getPostsByThreadAction } from "@/lib/actions/phase2";
import { getModuleByIdAction } from "@/lib/actions/modules";
import { PostTree } from "./PostTree";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; threadId: string }>;
}) {
  const { id, threadId } = await params;
  const threads = await getThreadsByModuleAction(id);
  const thread = threads.find((t) => t.id === threadId);
  return {
    title: thread ? thread.title : "Thread Diskusi",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string; threadId: string }>;
}) {
  const { id, threadId } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch module, threads, and posts in parallel.
  // getPostsByThreadAction also increments viewCount as a side effect.
  const [module, threads, posts] = await Promise.all([
    getModuleByIdAction(id),
    getThreadsByModuleAction(id),
    getPostsByThreadAction(threadId),
  ]);

  if (!module) notFound();

  const thread = threads.find((t) => t.id === threadId);
  if (!thread) notFound();

  const isStaff =
    session.user.role === "assistant" || session.user.role === "super_admin";
  const isThreadAuthor = thread.authorId === session.user.id;

  return (
    <div className="mx-auto max-w-4xl space-y-2 pb-12">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/lms/modules/${id}/discussion`}
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Diskusi</span>
        </Link>
        <span>/</span>
        <span className="max-w-[240px] truncate text-foreground">
          {thread.title}
        </span>
      </nav>

      {/* Thread header & all interactivity is handled by PostTree (client component) */}
      <PostTree
        thread={{
          id: thread.id,
          title: thread.title,
          authorName: thread.authorName,
          authorId: thread.authorId,
          createdAt: thread.createdAt.toISOString(),
          isPinned: thread.isPinned,
          isLocked: thread.isLocked,
          replyCount: thread.replyCount,
          viewCount: thread.viewCount,
        }}
        posts={posts.map((p) => ({
          id: p.id,
          threadId: p.threadId,
          parentId: p.parentId,
          authorId: p.authorId,
          authorName: p.authorName,
          content: p.content,
          isAnswer: p.isAnswer,
          isEdited: p.isEdited,
          editedAt: p.editedAt ? p.editedAt.toISOString() : null,
          deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
          createdAt: p.createdAt.toISOString(),
        }))}
        moduleId={id}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        isThreadAuthor={isThreadAuthor}
        isStaff={isStaff}
      />
    </div>
  );
}
