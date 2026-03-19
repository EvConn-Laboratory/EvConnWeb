"use client";

import { useState, useTransition } from "react";
import { MessageSquare, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { submitFeedbackAction } from "@/lib/actions/assignments";
import { HexRating } from "@/components/ui/hex-badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackType = "assistant" | "session" | "laboratory";

interface FeedbackCardState {
  rating: number;
  comment: string;
  submitted: boolean;
  error: string | null;
}

// ─── Single Feedback Card ─────────────────────────────────────────────────────

function FeedbackCard({
  type,
  label,
  description,
  moduleId,
  offeringId,
  alreadySubmitted,
}: {
  type: FeedbackType;
  label: string;
  description: string;
  moduleId: string;
  offeringId: string;
  alreadySubmitted: boolean;
}) {
  const [state, setState] = useState<FeedbackCardState>({
    rating: 0,
    comment: "",
    submitted: alreadySubmitted,
    error: null,
  });
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (state.rating === 0) {
      setState((s) => ({ ...s, error: "Please select a rating first (1-5 stars)." }));
      return;
    }

    const formData = new FormData();
    formData.set("offeringId", offeringId);
    formData.set("moduleId", moduleId);
    formData.set("type", type);
    formData.set("rating", String(state.rating));
    if (state.comment) formData.set("comment", state.comment);

    startTransition(async () => {
      const result = await submitFeedbackAction(null, formData);
      if ("error" in result) {
        setState((s) => ({ ...s, error: result.error }));
      } else {
        setState((s) => ({ ...s, submitted: true, error: null }));
      }
    });
  }

  if (state.submitted) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-green-200/60 bg-green-50/60 p-4 dark:border-green-800/40 dark:bg-green-950/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {label}
          </p>
        </div>
        <p className="text-xs text-green-600/70 dark:text-green-500">
          Feedback submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      <HexRating
        value={state.rating}
        onChange={(v) => setState((s) => ({ ...s, rating: v, error: null }))}
        readOnly={isPending}
      />

      <textarea
        value={state.comment}
        onChange={(e) => setState((s) => ({ ...s, comment: e.target.value }))}
        disabled={isPending}
        rows={2}
        placeholder="Additional comments (optional)..."
        maxLength={1000}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
      />

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {state.error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || state.rating === 0}
        className="self-start inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}

// ─── Main FeedbackSection ─────────────────────────────────────────────────────

export function FeedbackSection({
  moduleId,
  offeringId,
  allRequiredSubmitted,
  submittedFeedbackTypes,
}: {
  moduleId: string;
  offeringId: string;
  allRequiredSubmitted: boolean;
  submittedFeedbackTypes: string[];
}) {
  const feedbackCards: Array<{
    type: FeedbackType;
    label: string;
    description: string;
  }> = [
    {
      type: "assistant",
      label: "Assistant Feedback",
      description:
        "Rate the performance of the assistant during the session.",
    },
    {
      type: "session",
      label: "Session Feedback",
      description:
        "Rate the quality of the material and the flow of the practicum/discussion session.",
    },
    {
      type: "laboratory",
      label: "Laboratory Feedback",
      description:
        "Rate the condition of the laboratory, equipment, and facilities.",
    },
  ];

  const allFeedbackDone = feedbackCards.every((f) =>
    submittedFeedbackTypes.includes(f.type),
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">Module Feedback</h2>
      </div>

      {!allRequiredSubmitted ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
          <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Feedback Locked
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
              Please complete all required tasks before filling out the feedback
              for this module.
            </p>
          </div>
        </div>
      ) : allFeedbackDone ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200/60 bg-green-50/60 p-4 dark:border-green-800/40 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              All Feedback Submitted
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-500">
              Thank you for your feedback. This module is complete.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {feedbackCards.map((card) => (
            <FeedbackCard
              key={card.type}
              type={card.type}
              label={card.label}
              description={card.description}
              moduleId={moduleId}
              offeringId={offeringId}
              alreadySubmitted={submittedFeedbackTypes.includes(card.type)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
