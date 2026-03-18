"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { createAssistantProfileAction } from "@/lib/actions/personnel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Generation {
  id: string;
  number: number;
  name: string;
}

export function AddAssistantForm({ generations }: { generations: Generation[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createAssistantProfileAction(null, formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-3.5 w-3.5" />
        Add Assistant
      </Button>

      {open && (
        <form
          action={handleSubmit}
          className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-semibold text-foreground">New Assistant Profile</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <input
              name="fullName"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Full name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Generation</label>
            <select
              name="generationId"
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Select generation…</option>
              {generations.map((g) => (
                <option key={g.id} value={g.id}>
                  G{g.number} — {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Joined Year</label>
              <input
                name="joinedYear"
                type="number"
                min={2000}
                max={2100}
                required
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                placeholder="2024"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Status</label>
              <select
                name="status"
                defaultValue="active"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              GitHub URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="githubUrl"
              type="url"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="https://github.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Instagram URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="instagramUrl"
              type="url"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              LinkedIn URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="linkedinUrl"
              type="url"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground",
                isPending && "opacity-60",
              )}
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
