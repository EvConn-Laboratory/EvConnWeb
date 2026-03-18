"use client";

import { useState, useTransition } from "react";
import { Clock, CheckCircle2, Star, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitMcqAction, submitEssayAction } from "@/lib/actions/assignments";
import { submitGroupAssignmentAction } from "@/lib/actions/phase2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface McqQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  points: string;
  options: Array<{ id: string; optionText: string; orderIndex: number }>;
}

interface AssignmentData {
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
  groupId?: string | null;
  questions?: McqQuestion[];
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isDeadlinePast(iso: string | null): boolean {
  if (!iso) return false;
  return new Date() > new Date(iso);
}

// ─── MCQ Form ─────────────────────────────────────────────────────────────────

function McqForm({
  assignment,
  onSubmitSuccess,
}: {
  assignment: AssignmentData;
  onSubmitSuccess: (result: {
    score: number;
    maxScore: number;
    correct: number;
    total: number;
  }) => void;
}) {
  const questions = assignment.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deadlinePast = isDeadlinePast(assignment.deadline);
  const canResubmit = assignment.allowResubmit;
  const hasSubmission = !!assignment.submission;
  const isDisabled =
    isPending ||
    (hasSubmission && !canResubmit) ||
    (deadlinePast && !canResubmit);

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit() {
    const answerList = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: answers[q.id] ?? "",
    }));

    const unanswered = answerList.filter((a) => !a.selectedOptionId);
    if (unanswered.length > 0) {
      setError(`Jawab semua ${questions.length} soal terlebih dahulu.`);
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await submitMcqAction(assignment.id, answerList);
      if ("error" in result) {
        setError(result.error);
      } else if (result.data) {
        onSubmitSuccess(result.data);
      }
    });
  }

  return (
    <div className="space-y-5 pt-2">
      {questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            <span className="mr-2 text-muted-foreground">{qi + 1}.</span>
            {q.questionText}
            <span className="ml-2 text-xs text-muted-foreground">
              ({q.points} poin)
            </span>
          </p>
          <div className="space-y-1.5">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                  answers[q.id] === opt.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted/40",
                  isDisabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => handleSelect(q.id, opt.id)}
                  disabled={isDisabled}
                  className="accent-primary"
                />
                <span>{opt.optionText}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {hasSubmission && !canResubmit ? (
        <p className="text-xs text-muted-foreground">
          Jawaban sudah dikumpulkan. Pengumpulan ulang tidak diizinkan.
        </p>
      ) : deadlinePast && !canResubmit ? (
        <p className="text-xs text-red-500">Deadline telah lewat.</p>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Mengirim..."
            : hasSubmission
              ? "Kirim Ulang"
              : "Kumpulkan Jawaban"}
        </button>
      )}
    </div>
  );
}

// ─── Essay Form ───────────────────────────────────────────────────────────────

function EssayForm({ assignment }: { assignment: AssignmentData }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const deadlinePast = isDeadlinePast(assignment.deadline);
  const hasSubmission = !!assignment.submission;
  const canResubmit = assignment.allowResubmit;
  const isDisabled =
    isPending ||
    isUploading ||
    (hasSubmission && !canResubmit) ||
    (deadlinePast && !canResubmit);

  async function uploadSubmissionFile(file: File): Promise<string> {
    const data = new FormData();
    data.set("file", file);
    data.set("category", "submissions");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: data,
    });

    const payload = (await res.json()) as
      | { filePath?: string; error?: string }
      | undefined;

    if (!res.ok || !payload?.filePath) {
      throw new Error(payload?.error ?? "Gagal mengunggah file");
    }

    return payload.filePath;
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    formData.set("assignmentId", assignment.id);

    startTransition(async () => {
      const rawFile = formData.get("file");
      const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

      if (file) {
        if (file.type !== "application/pdf") {
          setError("File harus berformat PDF.");
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          setError("Ukuran file maksimal 10 MB.");
          return;
        }

        setIsUploading(true);
        try {
          const filePath = await uploadSubmissionFile(file);
          formData.set("filePath", filePath);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Gagal mengunggah file");
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      if (assignment.type === "study_group_task") {
        if (!assignment.groupId) {
          setError("Anda belum terdaftar ke kelompok study group.");
          return;
        }

        const result = await submitGroupAssignmentAction({
          assignmentId: assignment.id,
          groupId: assignment.groupId,
          textAnswer:
            ((formData.get("textAnswer") as string | null) ?? "").trim() ||
            undefined,
          filePath: ((formData.get("filePath") as string | null) ?? "") || undefined,
        });

        if ("error" in result) {
          setError(result.error);
        } else {
          setSuccess(true);
        }
        return;
      }

      const result = await submitEssayAction(null, formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-3 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Tugas berhasil dikumpulkan.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 pt-2">
      <input type="hidden" name="assignmentId" value={assignment.id} />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Jawaban Teks (opsional)
        </label>
        <textarea
          name="textAnswer"
          rows={5}
          defaultValue={assignment.submission?.textAnswer ?? ""}
          disabled={isDisabled}
          placeholder="Tulis jawaban atau catatan Anda di sini..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-3">
        <label className="block text-xs font-medium text-muted-foreground">
          File PDF (opsional, maks. 10 MB)
        </label>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          disabled={isDisabled}
          className="block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary-foreground hover:file:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {assignment.submission?.filePath && (
          <a
            href={assignment.submission.filePath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Lihat file yang telah dikumpulkan
          </a>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {hasSubmission && !canResubmit ? (
        <p className="text-xs text-muted-foreground">
          Jawaban sudah dikumpulkan. Pengumpulan ulang tidak diizinkan.
        </p>
      ) : deadlinePast && !canResubmit ? (
        <p className="text-xs text-red-500">Deadline telah lewat.</p>
      ) : (
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? isUploading
              ? "Mengunggah file..."
              : "Mengirim..."
            : hasSubmission
              ? "Kirim Ulang"
              : "Kumpulkan Tugas"}
        </button>
      )}
    </form>
  );
}

// ─── Main AssignmentPanel ─────────────────────────────────────────────────────

export function AssignmentPanel({
  assignment,
}: {
  assignment: AssignmentData;
}) {
  const [mcqResult, setMcqResult] = useState<{
    score: number;
    maxScore: number;
    correct: number;
    total: number;
  } | null>(null);

  const typeLabel: Record<string, string> = {
    tugas_rumah: "Tugas Rumah",
    tugas_praktikum: "Tugas Praktikum",
    study_group_task: "Tugas Study Group",
  };

  const typeColor: Record<string, string> = {
    tugas_rumah:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tugas_praktikum:
      "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    study_group_task:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  const formatLabel: Record<string, string> = {
    mcq: "MCQ",
    essay_pdf: "Essay / PDF",
  };

  const hasGrade = !!assignment.grade;
  const hasSubmission = !!assignment.submission;
  const deadline = formatDeadline(assignment.deadline);
  const deadlinePast = isDeadlinePast(assignment.deadline);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Assignment header */}
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              typeColor[assignment.type] ?? "bg-muted text-muted-foreground",
            )}
          >
            {typeLabel[assignment.type] ?? assignment.type}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {formatLabel[assignment.format] ?? assignment.format}
          </span>
          {assignment.isRequired && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              Wajib
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-foreground">
          {assignment.title}
        </h3>

        {assignment.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {assignment.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Nilai Maks: {assignment.maxScore}</span>
          {deadline && (
            <span
              className={cn(
                "flex items-center gap-1",
                deadlinePast ? "text-red-500" : "",
              )}
            >
              <Clock className="h-3 w-3" />
              Deadline: {deadline}
              {deadlinePast && " (lewat)"}
            </span>
          )}
        </div>
      </div>

      {/* Grade display */}
      {hasGrade && assignment.grade && (
        <div className="flex items-center gap-3 border-b border-border bg-green-500/5 px-4 py-3">
          <Star className="h-4 w-4 text-green-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              Nilai Diterima
            </p>
            {assignment.grade.comment && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {assignment.grade.comment}
              </p>
            )}
          </div>
          <span className="text-xl font-bold text-foreground">
            {Number(assignment.grade.score).toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground">
              /{Number(assignment.maxScore).toFixed(0)}
            </span>
          </span>
        </div>
      )}

      {/* Submission status (submitted but not graded) */}
      {hasSubmission && !hasGrade && (
        <div className="flex items-center gap-3 border-b border-border bg-blue-500/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Dikumpulkan
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(assignment.submission!.submittedAt).toLocaleDateString(
                "id-ID",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
              {assignment.submission!.isLate && (
                <span className="ml-2 text-amber-500">(Terlambat)</span>
              )}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Menunggu penilaian</span>
        </div>
      )}

      {/* MCQ result after submission */}
      {mcqResult && (
        <div className="flex items-center gap-3 border-b border-border bg-green-500/5 px-4 py-3">
          <Star className="h-4 w-4 text-green-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              Otomatis Dinilai
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {mcqResult.correct}/{mcqResult.total} jawaban benar
            </p>
          </div>
          <span className="text-xl font-bold text-foreground">
            {mcqResult.score.toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground">
              /{mcqResult.maxScore}
            </span>
          </span>
        </div>
      )}

      {/* Form body */}
      <div className="p-4">
        {assignment.format === "mcq" ? (
          <McqForm
            assignment={assignment}
            onSubmitSuccess={(result) => setMcqResult(result)}
          />
        ) : (
          <EssayForm assignment={assignment} />
        )}
      </div>
    </div>
  );
}
