"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteNewsArticleAction } from "@/lib/actions/cms";

export function DeleteNewsButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete article "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteNewsArticleAction(id);
      window.location.reload();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:border-red-800 dark:text-red-400"
    >
      <Trash2 className="h-3 w-3" />
      {isPending ? "…" : "Delete"}
    </button>
  );
}
