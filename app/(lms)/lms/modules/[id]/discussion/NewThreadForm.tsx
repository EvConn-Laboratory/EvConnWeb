"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, X, Loader2, MessageSquarePlus } from "lucide-react";
import { createThreadAction } from "@/lib/actions/phase2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult =
  | { success: true; data?: { threadId: string } }
  | { error: string };

// ─── Component ────────────────────────────────────────────────────────────────

export function NewThreadForm({
  moduleId,
  isStaff,
}: {
  moduleId: string;
  isStaff: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(createThreadAction, null);

  // On success, close and navigate to new thread
  useEffect(() => {
    if (state && "success" in state && state.data?.threadId) {
      setIsOpen(false);
      router.push(`/lms/modules/${moduleId}/discussion/${state.data.threadId}`);
    }
  }, [state, moduleId, router]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" className="shrink-0">
        <MessageSquarePlus className="h-4 w-4" />
        Buat Thread Baru
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border bg-card p-6 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            >
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquarePlus className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    Buat Thread Baru
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="moduleId" value={moduleId} />

                <div className="space-y-1.5">
                  <Label htmlFor="new-thread-title">Judul Thread</Label>
                  <Input
                    id="new-thread-title"
                    name="title"
                    placeholder="Tuliskan pertanyaan atau topik diskusi..."
                    required
                    minLength={5}
                    maxLength={200}
                    disabled={isPending}
                    autoFocus
                    className={cn(
                      state && "error" in state ? "border-destructive" : "",
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimal 5 karakter, maksimal 200 karakter
                  </p>
                </div>

                {/* Error notice */}
                {state && "error" in state && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {state.error}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-3.5 w-3.5" />
                        Buat Thread
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
