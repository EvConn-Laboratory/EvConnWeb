"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  ClipboardList,
  FileText,
  ListChecks,
  BookOpen,
  Clock,
  RefreshCw,
  Users,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAssignmentAction,
  deleteAssignmentAction,
  publishAssignmentAction,
  unpublishAssignmentAction,
  upsertMcqQuestionAction,
  deleteMcqQuestionAction,
} from "@/lib/actions/assignments";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface McqOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface McqQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  points: number;
  options: McqOption[];
}

export interface AssignmentWithQuestions {
  id: string;
  title: string;
  description: string | null;
  type: string;
  format: string;
  maxScore: string;
  deadline: Date | null;
  allowResubmit: boolean;
  isRequired: boolean;
  isPublished: boolean;
  orderIndex: number;
  questions?: McqQuestion[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none dark:bg-input/30";

const TYPE_LABELS: Record<string, string> = {
  tugas_rumah: "Pre-lab Homework",
  tugas_praktikum: "In-lab Assignment",
  study_group_task: "Study Group Task",
};

const FORMAT_LABELS: Record<string, string> = {
  mcq: "Multiple Choice (MCQ)",
  essay_pdf: "Essay + PDF Upload",
};

function toIsoLocal(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// ─── Assignment type / format badges ─────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    tugas_rumah: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    tugas_praktikum: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    study_group_task: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", colors[type] ?? "bg-muted text-muted-foreground border-border")}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function FormatBadge({ format }: { format: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
      format === "mcq"
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    )}>
      {format === "mcq" ? <ListChecks className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
      {format === "mcq" ? "MCQ" : "Essay + PDF"}
    </span>
  );
}

// ─── Add Assignment Form ──────────────────────────────────────────────────────

function AddAssignmentForm({
  moduleId,
  nextOrder,
  onCreated,
}: {
  moduleId: string;
  nextOrder: number;
  onCreated: (a: AssignmentWithQuestions) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tugas_rumah");
  const [format, setFormat] = useState("essay_pdf");
  const [maxScore, setMaxScore] = useState("100");
  const [deadline, setDeadline] = useState("");
  const [allowResubmit, setAllowResubmit] = useState(false);
  const [isRequired, setIsRequired] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle(""); setDescription(""); setType("tugas_rumah"); setFormat("essay_pdf");
    setMaxScore("100"); setDeadline(""); setAllowResubmit(false); setIsRequired(true);
    setIsPublished(false); setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }

    const fd = new FormData();
    fd.append("moduleId", moduleId);
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("type", type);
    fd.append("format", format);
    fd.append("maxScore", maxScore);
    if (deadline) fd.append("deadline", deadline);
    fd.append("allowResubmit", String(allowResubmit));
    fd.append("isRequired", String(isRequired));
    fd.append("orderIndex", String(nextOrder));
    fd.append("isPublished", String(isPublished));

    startTransition(async () => {
      const res = await createAssignmentAction(null, fd);
      if (res && "error" in res) { setError(res.error); return; }
      onCreated({
        id: (res as any).data?.id ?? crypto.randomUUID(),
        title: title.trim(),
        description: description.trim() || null,
        type,
        format,
        maxScore,
        deadline: deadline ? new Date(deadline) : null,
        allowResubmit,
        isRequired,
        isPublished,
        orderIndex: nextOrder,
        questions: format === "mcq" ? [] : undefined,
      });
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
            <DialogDescription>
              Create pre-lab homework, in-lab assignments, or MCQ quizzes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <Label htmlFor="as-title" className="text-left block font-semibold">Title</Label>
              <Input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pre-lab Quiz — Networking Basics" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-desc" className="text-left block font-semibold">
                Instructions <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <textarea
                id="as-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description or instructions"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as-type" className="text-left block font-semibold">Assignment Type</Label>
                <select id="as-type" value={type} onChange={(e) => setType(e.target.value)} className={SELECT_CLASS}>
                  <option value="tugas_rumah">Pre-lab Homework</option>
                  <option value="tugas_praktikum">In-lab Assignment</option>
                  <option value="study_group_task">Study Group Task</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="as-format" className="text-left block font-semibold">Submission Format</Label>
                <select id="as-format" value={format} onChange={(e) => setFormat(e.target.value)} className={SELECT_CLASS}>
                  <option value="essay_pdf">Essay + PDF Upload</option>
                  <option value="mcq">Multiple Choice (MCQ)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as-score" className="text-left block font-semibold">Max Score</Label>
                <Input id="as-score" type="number" min={1} max={1000} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="as-deadline" className="text-left block font-semibold">
                  Deadline <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="as-deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 mt-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block text-left mb-1">Status & Behavior</Label>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
                  <span className="text-foreground">Required for completion</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={allowResubmit} onChange={(e) => setAllowResubmit(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
                  <span className="text-foreground">Allow resubmit</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
                  <span className="text-foreground">Publish immediately</span>
                </label>
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── MCQ Option row editor ────────────────────────────────────────────────────

interface OptionDraft {
  optionText: string;
  isCorrect: boolean;
}

function McqQuestionForm({
  assignmentId,
  nextOrder,
  existingQuestion,
  onSaved,
  onCancel,
}: {
  assignmentId: string;
  nextOrder: number;
  existingQuestion?: McqQuestion;
  onSaved: (q: McqQuestion) => void;
  onCancel: () => void;
}) {
  const [questionText, setQuestionText] = useState(existingQuestion?.questionText ?? "");
  const [points, setPoints] = useState(String(existingQuestion?.points ?? 1));
  const [options, setOptions] = useState<OptionDraft[]>(
    existingQuestion?.options.map((o) => ({ optionText: o.optionText, isCorrect: o.isCorrect })) ??
      [
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, { optionText: "", isCorrect: false }]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  function setCorrect(idx: number) {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) { setError("Question text is required"); return; }
    const filledOptions = options.filter((o) => o.optionText.trim());
    if (filledOptions.length < 2) { setError("At least 2 options are required"); return; }
    if (!filledOptions.some((o) => o.isCorrect)) { setError("Mark at least one option as correct"); return; }

    startTransition(async () => {
      const res = await upsertMcqQuestionAction(
        {
          assignmentId,
          questionText: questionText.trim(),
          orderIndex: existingQuestion?.orderIndex ?? nextOrder,
          points: Number(points) || 1,
          options: filledOptions.map((o, i) => ({
            optionText: o.optionText.trim(),
            isCorrect: o.isCorrect,
            orderIndex: i,
          })),
        },
        existingQuestion?.id,
      );

      if ("error" in res) { setError(res.error); return; }

      onSaved({
        id: res.data?.questionId ?? existingQuestion?.id ?? crypto.randomUUID(),
        questionText: questionText.trim(),
        orderIndex: existingQuestion?.orderIndex ?? nextOrder,
        points: Number(points) || 1,
        options: filledOptions.map((o, i) => ({
          id: crypto.randomUUID(),
          optionText: o.optionText.trim(),
          isCorrect: o.isCorrect,
          orderIndex: i,
        })),
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="q-text">Question</Label>
        <Input
          id="q-text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter question text"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="q-pts">Points</Label>
        <Input id="q-pts" type="number" min={0.01} step={0.01} value={points} onChange={(e) => setPoints(e.target.value)} className="max-w-[120px]" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Answer Options</Label>
          <span className="text-xs text-muted-foreground">Click ★ to mark correct</span>
        </div>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrect(i)}
              className={cn(
                "shrink-0 rounded p-1 transition-colors",
                opt.isCorrect
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground/30 hover:text-muted-foreground",
              )}
              title="Mark as correct"
            >
              <Star className={cn("h-4 w-4", opt.isCorrect && "fill-current")} />
            </button>
            <Input
              value={opt.optionText}
              onChange={(e) => setOptions(options.map((o, j) => j === i ? { ...o, optionText: e.target.value } : o))}
              placeholder={`Option ${i + 1}`}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={options.length <= 2}
              className="shrink-0 rounded p-1 text-muted-foreground/40 transition-colors hover:text-red-500 disabled:opacity-30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {options.length < 6 && (
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={addOption}>
            <Plus className="h-3 w-3" /> Add Option
          </Button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : existingQuestion ? "Update Question" : "Add Question"}
        </Button>
      </div>
    </form>
  );
}

// ─── MCQ Questions Panel ──────────────────────────────────────────────────────

function McqQuestionsPanel({
  assignment,
  onQuestionsChanged,
}: {
  assignment: AssignmentWithQuestions;
  onQuestionsChanged: (questions: McqQuestion[]) => void;
}) {
  const [questions, setQuestions] = useState<McqQuestion[]>(assignment.questions ?? []);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onQuestionsChanged(questions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  function upsert(q: McqQuestion) {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id);
      return idx >= 0 ? prev.map((x) => x.id === q.id ? q : x) : [...prev, q];
    });
    setAddingNew(false);
    setEditingId(null);
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Questions <span className="font-normal text-muted-foreground">({questions.length})</span>
          </p>
          {questions.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Total: {totalPoints} pt{totalPoints !== 1 ? "s" : ""} → scaled to {assignment.maxScore} max
            </p>
          )}
        </div>
        {!addingNew && (
          <Button size="xs" variant="outline" className="gap-1" onClick={() => setAddingNew(true)}>
            <Plus className="h-3 w-3" /> Add Question
          </Button>
        )}
      </div>

      {questions.length === 0 && !addingNew && (
        <p className="text-xs text-muted-foreground">No questions yet. Add at least one question.</p>
      )}

      {questions.map((q, idx) => (
        <div key={q.id}>
          {editingId === q.id ? (
            <McqQuestionForm
              assignmentId={assignment.id}
              nextOrder={idx}
              existingQuestion={q}
              onSaved={upsert}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    <span className="mr-1.5 text-xs text-muted-foreground">{idx + 1}.</span>
                    {q.questionText}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{q.points} pt{q.points !== 1 ? "s" : ""} · {q.options.length} options</p>
                  <div className="mt-2 space-y-1">
                    {q.options.map((o, oi) => (
                      <div key={o.id} className={cn(
                        "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                        o.isCorrect ? "bg-green-500/10 text-green-700 dark:text-green-400" : "text-muted-foreground",
                      )}>
                        {o.isCorrect ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <span className="h-3 w-3 shrink-0 flex items-center justify-center text-[10px] rounded-full border border-current opacity-50">{String.fromCharCode(65 + oi)}</span>}
                        {o.optionText}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditingId(q.id)}
                    className="rounded p-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit question"
                  >
                    Edit
                  </button>
                  <button
                    disabled={deletingId === q.id}
                    onClick={() => {
                      if (!confirm("Delete this question?")) return;
                      setDeletingId(q.id);
                      deleteMcqQuestionAction(q.id).then((res) => {
                        if ("success" in res) {
                          setQuestions((prev) => prev.filter((x) => x.id !== q.id));
                        }
                        setDeletingId(null);
                      });
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                    title="Delete question"
                  >
                    {deletingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew && (
        <McqQuestionForm
          assignmentId={assignment.id}
          nextOrder={questions.length}
          onSaved={upsert}
          onCancel={() => setAddingNew(false)}
        />
      )}
    </div>
  );
}

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({
  assignment,
  onTogglePublished,
  onDelete,
  onQuestionsChanged,
}: {
  assignment: AssignmentWithQuestions;
  onTogglePublished: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
  onQuestionsChanged: (id: string, questions: McqQuestion[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();

  const questionCount = assignment.questions?.length ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-medium text-foreground truncate">{assignment.title}</p>
            {assignment.isRequired && (
              <span className="text-[10px] text-red-500 font-medium">Required</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={assignment.type} />
            <FormatBadge format={assignment.format} />
            <span className="text-[11px] text-muted-foreground">
              Max: {assignment.maxScore}
            </span>
            {assignment.deadline && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(assignment.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {assignment.allowResubmit && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <RefreshCw className="h-3 w-3" /> Resubmit allowed
              </span>
            )}
          </div>
          {assignment.format === "mcq" && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {questionCount} question{questionCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Published badge */}
        <span className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
          assignment.isPublished
            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
            : "bg-muted text-muted-foreground border-border",
        )}>
          {assignment.isPublished ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
          {assignment.isPublished ? "Published" : "Draft"}
        </span>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Toggle published */}
          <button
            disabled={toggling}
            onClick={() => startToggle(async () => {
              const res = assignment.isPublished
                ? await unpublishAssignmentAction(assignment.id)
                : await publishAssignmentAction(assignment.id);
              if ("success" in res) onTogglePublished(assignment.id, !assignment.isPublished);
            })}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
            title={assignment.isPublished ? "Unpublish" : "Publish"}
          >
            {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : assignment.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>

          {/* Delete */}
          <button
            disabled={deleting}
            onClick={() => {
              if (!confirm(`Delete "${assignment.title}"? This cannot be undone if there are no submissions.`)) return;
              startDelete(async () => {
                const res = await deleteAssignmentAction(assignment.id);
                if ("success" in res) onDelete(assignment.id);
                else alert(res.error);
              });
            }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
            title="Delete"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>

          {/* Expand for MCQ */}
          {assignment.format === "mcq" && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              title={expanded ? "Collapse" : "Manage questions"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* MCQ questions panel */}
      {assignment.format === "mcq" && expanded && (
        <div className="border-t border-border px-4 pb-4">
          <McqQuestionsPanel
            assignment={assignment}
            onQuestionsChanged={(qs) => onQuestionsChanged(assignment.id, qs)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AssignmentsManager({
  moduleId,
  initialAssignments,
}: {
  moduleId: string;
  initialAssignments: AssignmentWithQuestions[];
}) {
  const [assignments, setAssignments] = useState<AssignmentWithQuestions[]>(initialAssignments);

  function handleTogglePublished(id: string, val: boolean) {
    setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, isPublished: val } : a));
  }

  function handleDelete(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCreated(a: AssignmentWithQuestions) {
    setAssignments((prev) => [...prev, a]);
  }

  function handleQuestionsChanged(assignmentId: string, questions: McqQuestion[]) {
    setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, questions } : a));
  }

  const publishedCount = assignments.filter((a) => a.isPublished).length;
  const requiredCount = assignments.filter((a) => a.isRequired).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Assignments</h2>
          <p className="text-xs text-muted-foreground">
            {assignments.length === 0
              ? "No assignments yet"
              : `${assignments.length} assignment${assignments.length !== 1 ? "s" : ""} · ${requiredCount} required · ${publishedCount} published`}
          </p>
        </div>
        <AddAssignmentForm
          moduleId={moduleId}
          nextOrder={assignments.length}
          onCreated={handleCreated}
        />
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">No assignments yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create pre-lab homework, in-lab assignments, or MCQ quizzes for this module.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              onTogglePublished={handleTogglePublished}
              onDelete={handleDelete}
              onQuestionsChanged={handleQuestionsChanged}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-blue-500" /> MCQ — auto-graded on submit</span>
          <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-green-500" /> Essay + PDF — manually graded by assistant</span>
          <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-amber-500" /> Required assignments must be submitted for module completion</span>
        </div>
      </div>
    </div>
  );
}
