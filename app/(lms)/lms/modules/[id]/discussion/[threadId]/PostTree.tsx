"use client";

import {
  useActionState,
  useState,
  useEffect,
  useTransition,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  Lock,
  Unlock,
  CheckCircle2,
  MessageSquare,
  Eye,
  ThumbsUp,
  Reply,
  Edit2,
  Trash2,
  Loader2,
  ChevronDown,
  Award,
} from "lucide-react";
import {
  createPostAction,
  editPostAction,
  deletePostAction,
  toggleReactionAction,
  markAnswerAction,
  pinThreadAction,
  lockThreadAction,
} from "@/lib/actions/phase2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeUp, stagger, fadeIn } from "@/lib/animations/variants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostData = {
  id: string;
  threadId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  isAnswer: boolean;
  isEdited: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type ThreadData = {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  viewCount: number;
};

type PostNode = PostData & { children: PostNode[] };

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(posts: PostData[]): PostNode[] {
  const map = new Map<string, PostNode>();
  const roots: PostNode[] = [];

  // First pass: build map
  posts.forEach((p) => map.set(p.id, { ...p, children: [] }));

  // Second pass: wire up parent/child relationships
  posts.forEach((p) => {
    const node = map.get(p.id)!;
    if (p.parentId) {
      const parent = map.get(p.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphaned reply — treat as top-level
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "xs" | "sm" }) {
  const colors = [
    "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    "bg-violet-500/20 text-violet-600 dark:text-violet-400",
    "bg-green-500/20 text-green-600 dark:text-green-400",
    "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    "bg-rose-500/20 text-rose-600 dark:text-rose-400",
  ];
  // Deterministic color based on name
  const colorIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        colors[colorIndex],
        size === "xs" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Reply Form ───────────────────────────────────────────────────────────────

function ReplyForm({
  threadId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "Tulis balasan...",
  autoFocus = true,
}: {
  threadId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ postId: string }> | null,
    FormData
  >(createPostAction, null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state && "success" in state) {
      onSuccess();
    }
  }, [state, onSuccess]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <input type="hidden" name="threadId" value={threadId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <textarea
        ref={textareaRef}
        name="content"
        placeholder={placeholder}
        required
        minLength={1}
        maxLength={10000}
        disabled={isPending}
        rows={3}
        className={cn(
          "w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
          "transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        )}
      />

      {state && "error" in state && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isPending ? "Mengirim..." : "Kirim Balasan"}
        </Button>
      </div>
    </motion.form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  postId,
  currentContent,
  onSuccess,
  onCancel,
}: {
  postId: string;
  currentContent: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(editPostAction, null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state && "success" in state) {
      onSuccess();
    }
  }, [state, onSuccess]);

  useEffect(() => {
    textareaRef.current?.focus();
    // Place cursor at end
    const el = textareaRef.current;
    if (el) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, []);

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <input type="hidden" name="postId" value={postId} />

      <textarea
        ref={textareaRef}
        name="content"
        defaultValue={currentContent}
        required
        minLength={1}
        maxLength={10000}
        disabled={isPending}
        rows={4}
        className={cn(
          "w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm text-foreground",
          "transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        )}
      />

      {state && "error" in state && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </motion.form>
  );
}

// ─── Post Node ────────────────────────────────────────────────────────────────

function PostNode({
  node,
  depth,
  threadId,
  currentUserId,
  currentUserRole,
  isThreadAuthor,
  isLocked,
  reactions,
  onReaction,
  onDeleteSuccess,
  onMarkAnswer,
  index,
}: {
  node: PostNode;
  depth: number;
  threadId: string;
  currentUserId: string;
  currentUserRole: string;
  isThreadAuthor: boolean;
  isLocked: boolean;
  reactions: Record<string, { count: number; userReacted: boolean }>;
  onReaction: (postId: string) => void;
  onDeleteSuccess: () => void;
  onMarkAnswer: (postId: string) => void;
  index: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isMarkingAnswer, startMarkAnswer] = useTransition();

  const isDeleted = !!node.deletedAt;
  const isOwner = node.authorId === currentUserId;
  const isStaff =
    currentUserRole === "super_admin" || currentUserRole === "assistant";

  const canEdit = isOwner && !isDeleted && !showEditForm;
  const canDelete = (isOwner || isStaff) && !isDeleted;
  const canReply = !isLocked || isStaff;
  const canMarkAnswer =
    (isThreadAuthor || isStaff) && !isDeleted && !node.isAnswer;

  const reaction = reactions[node.id] ?? { count: 0, userReacted: false };

  // Cap nesting depth at 2 for visual cleanliness
  const canNestFurther = depth < 2;

  const handleDelete = () => {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deletePostAction(node.id);
      if ("error" in result) {
        setDeleteError(result.error);
      } else {
        onDeleteSuccess();
      }
    });
  };

  const handleMarkAnswer = () => {
    startMarkAnswer(async () => {
      const result = await markAnswerAction(node.id, threadId);
      if ("success" in result) {
        onMarkAnswer(node.id);
      }
    });
  };

  // Deleted post: show placeholder + continue rendering children
  if (isDeleted) {
    return (
      <motion.div
        variants={fadeUp}
        custom={index}
        className={cn(depth > 0 && "ml-6 border-l-2 border-border pl-4")}
      >
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm italic text-muted-foreground">
            [Pesan dihapus]
          </p>
        </div>

        {/* Still show children of deleted posts */}
        {node.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {node.children.map((child, i) => (
              <PostNode
                key={child.id}
                node={child}
                depth={depth + 1}
                threadId={threadId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isThreadAuthor={isThreadAuthor}
                isLocked={isLocked}
                reactions={reactions}
                onReaction={onReaction}
                onDeleteSuccess={onDeleteSuccess}
                onMarkAnswer={onMarkAnswer}
                index={i}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={cn(depth > 0 && "ml-6 border-l-2 border-border pl-4")}
    >
      <div
        className={cn(
          "rounded-xl border bg-card p-4 transition-colors",
          node.isAnswer
            ? "border-green-500/40 bg-green-500/5 dark:bg-green-500/10"
            : "border-border",
        )}
      >
        {/* Accepted answer badge */}
        {node.isAnswer && (
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
            <Award className="h-4 w-4" />
            Jawaban Diterima
          </div>
        )}

        {/* Post header */}
        <div className="mb-3 flex items-start gap-3">
          <Avatar name={node.authorName} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                {node.authorName}
              </span>
              {node.authorId === currentUserId && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Kamu
                </span>
              )}
              {(currentUserRole === "assistant" ||
                currentUserRole === "super_admin") &&
                node.authorId !== currentUserId && (
                  <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    Staff
                  </span>
                )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{formatRelativeTime(node.createdAt)}</span>
              {node.isEdited && (
                <>
                  <span>&bull;</span>
                  <span className="italic">
                    diedit {formatRelativeTime(node.editedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content or edit form */}
        <AnimatePresence mode="wait">
          {showEditForm ? (
            <EditForm
              key="edit"
              postId={node.id}
              currentContent={node.content}
              onSuccess={() => {
                setShowEditForm(false);
                onDeleteSuccess(); // reuse the refresh callback
              }}
              onCancel={() => setShowEditForm(false)}
            />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground"
            >
              {node.content}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action toolbar (only shown when not editing) */}
        {!showEditForm && (
          <div className="flex flex-wrap items-center gap-1">
            {/* Reaction button */}
            <button
              onClick={() => onReaction(node.id)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
                reaction.userReacted
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title="Suka"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{reaction.count}</span>
            </button>

            {/* Reply button */}
            {canReply && !showReplyForm && (
              <button
                onClick={() => setShowReplyForm(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Balas"
              >
                <Reply className="h-3.5 w-3.5" />
                Balas
              </button>
            )}

            {/* Mark as answer */}
            {canMarkAnswer && (
              <button
                onClick={handleMarkAnswer}
                disabled={isMarkingAnswer}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-600 disabled:opacity-50 dark:hover:text-green-400"
                title="Tandai sebagai jawaban"
              >
                {isMarkingAnswer ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Tandai Jawaban
              </button>
            )}

            {/* Edit button */}
            {canEdit && (
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Edit pesan"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}

            {/* Delete button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title="Hapus pesan"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            )}
          </div>
        )}

        {/* Delete error */}
        {deleteError && (
          <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {deleteError}
          </p>
        )}

        {/* Inline reply form */}
        <AnimatePresence>
          {showReplyForm && (
            <div className="mt-3 border-t border-border pt-3">
              <ReplyForm
                threadId={threadId}
                parentId={canNestFurther ? node.id : undefined}
                placeholder={`Balas ke ${node.authorName}...`}
                onSuccess={() => {
                  setShowReplyForm(false);
                  onDeleteSuccess(); // reuse the refresh callback
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Nested children */}
      {node.children.length > 0 && (
        <motion.div variants={stagger} className="mt-2 space-y-2">
          {node.children.map((child, i) => (
            <PostNode
              key={child.id}
              node={child}
              depth={depth + 1}
              threadId={threadId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isThreadAuthor={isThreadAuthor}
              isLocked={isLocked}
              reactions={reactions}
              onReaction={onReaction}
              onDeleteSuccess={onDeleteSuccess}
              onMarkAnswer={onMarkAnswer}
              index={i}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Staff Thread Controls ────────────────────────────────────────────────────

function StaffThreadControls({
  threadId,
  moduleId,
  isPinned,
  isLocked,
  onRefresh,
}: {
  threadId: string;
  moduleId: string;
  isPinned: boolean;
  isLocked: boolean;
  onRefresh: () => void;
}) {
  const [isPinning, startPin] = useTransition();
  const [isLocking, startLock] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePin = () => {
    setError(null);
    startPin(async () => {
      const result = await pinThreadAction(threadId, !isPinned);
      if ("error" in result) {
        setError(result.error);
      } else {
        onRefresh();
      }
    });
  };

  const handleLock = () => {
    setError(null);
    startLock(async () => {
      const result = await lockThreadAction(threadId, !isLocked);
      if ("error" in result) {
        setError(result.error);
      } else {
        onRefresh();
      }
    });
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Kontrol Staff
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePin}
          disabled={isPinning || isLocking}
          className={cn(isPinned && "border-primary/40 text-primary")}
        >
          {isPinning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
          {isPinned ? "Lepas Sematan" : "Sematkan Thread"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLock}
          disabled={isLocking || isPinning}
          className={cn(
            isLocked &&
              "border-amber-500/40 text-amber-600 dark:text-amber-400",
          )}
        >
          {isLocking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isLocked ? (
            <Unlock className="h-3.5 w-3.5" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
          {isLocked ? "Buka Kunci Thread" : "Kunci Thread"}
        </Button>
      </div>
      {error && (
        <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main PostTree Component ──────────────────────────────────────────────────

export function PostTree({
  thread,
  posts,
  moduleId,
  currentUserId,
  currentUserRole,
  isThreadAuthor,
  isStaff,
}: {
  thread: ThreadData;
  posts: PostData[];
  moduleId: string;
  currentUserId: string;
  currentUserRole: string;
  isThreadAuthor: boolean;
  isStaff: boolean;
}) {
  const router = useRouter();

  // Optimistic reaction state: starts empty (0 counts), updates on toggle
  const [reactions, setReactions] = useState<
    Record<string, { count: number; userReacted: boolean }>
  >({});

  // Optimistic thread state for pin/lock (updated on staff actions)
  const [threadState, setThreadState] = useState({
    isPinned: thread.isPinned,
    isLocked: thread.isLocked,
  });

  // Used to track locally-marked answers (optimistic)
  const [localAnswerId, setLocalAnswerId] = useState<string | null>(
    posts.find((p) => p.isAnswer)?.id ?? null,
  );

  const triggerRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleReaction = useCallback(async (postId: string) => {
    // Optimistic update
    setReactions((prev) => {
      const cur = prev[postId] ?? { count: 0, userReacted: false };
      return {
        ...prev,
        [postId]: {
          count: cur.userReacted
            ? Math.max(0, cur.count - 1)
            : cur.count + 1,
          userReacted: !cur.userReacted,
        },
      };
    });

    const result = await toggleReactionAction(postId, "👍");

    if ("error" in result) {
      // Revert optimistic update on error
      setReactions((prev) => {
        const cur = prev[postId] ?? { count: 0, userReacted: false };
        return {
          ...prev,
          [postId]: {
            count: cur.userReacted
              ? Math.max(0, cur.count - 1)
              : cur.count + 1,
            userReacted: !cur.userReacted,
          },
        };
      });
    }
  }, []);

  const handleMarkAnswer = useCallback(
    (postId: string) => {
      setLocalAnswerId(postId);
      triggerRefresh();
    },
    [triggerRefresh],
  );

  const handleStaffRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Build tree from flat posts, and apply local answer state
  const postsWithLocalAnswer = posts.map((p) => ({
    ...p,
    isAnswer: localAnswerId !== null ? p.id === localAnswerId : p.isAnswer,
  }));
  const tree = buildTree(postsWithLocalAnswer);

  const canReplyToThread = !threadState.isLocked || isStaff;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Thread Header Card */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-border bg-card p-5"
      >
        {/* Pin + lock badges */}
        {(threadState.isPinned || threadState.isLocked) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {threadState.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Pin className="h-3 w-3" />
                Disematkan
              </span>
            )}
            {threadState.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                Dikunci
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {thread.title}
        </h1>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Oleh{" "}
            <span className="font-medium text-foreground/70">
              {thread.authorName}
            </span>
          </span>
          <span>
            {new Date(thread.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {thread.replyCount} balasan
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {thread.viewCount} dilihat
          </span>
        </div>

        {/* Staff controls */}
        {isStaff && (
          <StaffThreadControls
            threadId={thread.id}
            moduleId={moduleId}
            isPinned={threadState.isPinned}
            isLocked={threadState.isLocked}
            onRefresh={handleStaffRefresh}
          />
        )}
      </motion.div>

      {/* Locked notice */}
      {threadState.isLocked && (
        <motion.div
          variants={fadeIn}
          className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-400"
        >
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Thread ini telah dikunci oleh instruktur. Balasan baru tidak dapat
            ditambahkan.
          </span>
        </motion.div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center"
        >
          <MessageSquare className="mb-3 h-9 w-9 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada balasan
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {canReplyToThread
              ? "Jadilah yang pertama memberikan balasan!"
              : "Thread ini dikunci."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="space-y-3">
          {tree.map((node, i) => (
            <PostNode
              key={node.id}
              node={node}
              depth={0}
              threadId={thread.id}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isThreadAuthor={isThreadAuthor}
              isLocked={threadState.isLocked}
              reactions={reactions}
              onReaction={handleReaction}
              onDeleteSuccess={triggerRefresh}
              onMarkAnswer={handleMarkAnswer}
              index={i}
            />
          ))}
        </motion.div>
      )}

      {/* Main reply form at bottom */}
      {canReplyToThread && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" />
            Tulis Balasan
          </h3>
          <BottomReplyForm
            threadId={thread.id}
            onSuccess={triggerRefresh}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Bottom Reply Form (stateful reset on success) ───────────────────────────

function BottomReplyForm({
  threadId,
  onSuccess,
}: {
  threadId: string;
  onSuccess: () => void;
}) {
  // Use a key to reset the form after successful submission
  const [formKey, setFormKey] = useState(0);

  const handleSuccess = useCallback(() => {
    setFormKey((k) => k + 1);
    onSuccess();
  }, [onSuccess]);

  return (
    <ReplyForm
      key={formKey}
      threadId={threadId}
      placeholder="Bagikan pendapat, pertanyaan, atau jawaban kamu..."
      autoFocus={false}
      onSuccess={handleSuccess}
      onCancel={() => {}}
    />
  );
}
