"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { createAssistantProfileAction } from "@/lib/actions/personnel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Generation {
  id: string;
  number: number;
  name: string;
}

interface UserForLinking {
  id: string;
  name: string;
  email: string | null;
}

export function AddAssistantForm({
  generations,
  usersForLinking,
}: {
  generations: Generation[];
  usersForLinking: UserForLinking[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createAssistantProfileAction(null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Add Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Assistant Profile</DialogTitle>
            <DialogDescription>
              Create a new assistant profile for the Hall of Fame.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Full Name</label>
              <input
                name="fullName"
                required
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Link to User Account <span className="text-muted-foreground text-left block">(optional)</span>
              </label>
              <select
                name="userId"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— No link —</option>
                {usersForLinking.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground text-left">
                Link to an existing user so they appear in Users and can be assigned to offerings.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Generation</label>
              <select
                name="generationId"
                required
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                <label className="text-xs font-medium text-foreground block text-left">Joined Year</label>
                <input
                  name="joinedYear"
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="2024"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Status</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                GitHub URL <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="githubUrl"
                type="url"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder-text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Instagram URL <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="instagramUrl"
                type="url"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder-text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                LinkedIn URL <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="linkedinUrl"
                type="url"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder-text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Assistant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
