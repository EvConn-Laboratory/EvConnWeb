"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Star,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveDraftGradeAction, publishGradeAction } from "@/lib/actions/grading";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmissionRow {
  submissionId: string;
  studentName: string;
  studentNim: string | null;
  assignmentTitle: string;
  assignmentType: string;
  assignmentFormat: string;
  maxScore: string;
  moduleTitle: string;
  submittedAt: string;
  isLate: boolean;
  textAnswer: string | null;
  filePath: string | null;
  gradeId: string | null;
  score: string | null;
  comment: string | null;
  gradeStatus: string | null;
}

// ─── Grade form ───────────────────────────────────────────────────────────────

function GradeForm({
  submission,
  onGraded,
}: {
  submission: SubmissionRow;
  onGraded: (submissionId: string, score: string, status: string) => void;
}) {
  const [score, setScore] = useState(submission.score ?? "");
  const [comment, setComment] = useState(submission.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxScore = Number(submission.maxScore);

  function handleSave(status: "draft" | "published") {
    setError(null);
    const fd = new FormData();
    fd.set("submissionId", submission.submissionId);
    fd.set("score", score);
    fd.set("status", status);
    if (comment) fd.set("comment", comment);

    startTransition(async () => {
      const action = status === "draft" ? saveDraftGradeAction : publishGradeAction;
      const result = await action(null, fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        onGraded(submission.submissionId, score, status);
      }
    });
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      {/* Submission content */}
      {submission.textAnswer && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Jawaban Teks
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg bg-background p-3">
            <p className="whitespace-pre-wrap text-xs text-foreground">
              {submission.textAnswer}
            </p>
          </div>
        </div>
      )}
      {submission.filePath && (
        <a
          href={submission.filePath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-primary hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          Buka file PDF
        </a>
      )}

      {/* Grading inputs */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Nilai (maks {maxScore})
          </label>
          <input
            type="number"
            min={0}
            max={maxScore}
            step={0.5}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="0"
          />
        </div>
        <div className="flex-1 min-w-48 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Komentar (opsional)
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Catatan untuk mahasiswa..."
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={isPending || !score}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Simpan Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave("published")}
          disabled={isPending || !score}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Publikasikan Nilai
        </button>
      </div>
    </div>
  );
}

// ─── Single submission row ────────────────────────────────────────────────────

function SubmissionItem({ sub }: { sub: SubmissionRow }) {
  const [expanded, setExpanded] = useState(false);
  const [localGrade, setLocalGrade] = useState<{ score: string; status: string } | null>(
    sub.gradeId ? { score: sub.score ?? "", status: sub.gradeStatus ?? "" } : null,
  );

  const isGraded = localGrade?.status === "published";
  const isDraft = localGrade?.status === "draft";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-colors",
        isGraded ? "border-green-500/20" : isDraft ? "border-amber-500/20" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isGraded
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : isDraft
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-blue-500/10 text-blue-500",
          )}
        >
          {isGraded ? <Star className="h-4 w-4" /> : isDraft ? <Clock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{sub.studentName}</span>
            {sub.studentNim && (
              <span className="font-mono text-[11px] text-muted-foreground">{sub.studentNim}</span>
            )}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                isGraded
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : isDraft
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-500",
              )}
            >
              {isGraded
                ? `${Number(localGrade!.score).toFixed(0)}/${Number(sub.maxScore).toFixed(0)}`
                : isDraft
                  ? "Draft Nilai"
                  : "Belum Dinilai"}
            </span>
            {sub.isLate && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                Terlambat
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {sub.assignmentTitle} · {sub.moduleTitle}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {new Date(sub.submittedAt).toLocaleString("id-ID")}
          </p>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          <GradeForm
            submission={{
              ...sub,
              score: localGrade?.score ?? sub.score,
              gradeStatus: localGrade?.status ?? sub.gradeStatus,
            }}
            onGraded={(_, score, status) => setLocalGrade({ score, status })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GradingInterface({ submissions }: { submissions: SubmissionRow[] }) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Semua sudah dinilai!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tidak ada tugas essay/PDF yang menunggu penilaian.
        </p>
      </div>
    );
  }

  const pending = submissions.filter((s) => !s.gradeId || s.gradeStatus === "draft");
  const graded = submissions.filter((s) => s.gradeStatus === "published");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menunggu Penilaian ({pending.length})
          </h3>
          {pending.map((sub) => (
            <SubmissionItem key={sub.submissionId} sub={sub} />
          ))}
        </div>
      )}
      {graded.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sudah Dinilai ({graded.length})
          </h3>
          {graded.map((sub) => (
            <SubmissionItem key={sub.submissionId} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
