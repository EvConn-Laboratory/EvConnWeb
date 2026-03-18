"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { acceptStudyGroupInviteAction } from "@/lib/actions/phase2";

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptStudyGroupInviteAction(token);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/lms/courses");
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <Users className="h-4 w-4" />
            Bergabung Sekarang
          </>
        )}
      </button>
    </div>
  );
}
