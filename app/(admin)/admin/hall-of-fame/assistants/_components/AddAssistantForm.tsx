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
import { ImagePicker } from "@/components/ImagePicker";

interface Generation {
  id: string;
  number: number;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

interface GalleryItem {
  id: string;
  title: string | null;
  filePath: string;
}

interface UserForLinking {
  id: string;
  name: string;
  email: string | null;
}

export function AddAssistantForm({
  generations,
  usersForLinking,
  availableRoles,
  galleryItems,
}: {
  generations: Generation[];
  usersForLinking: UserForLinking[];
  availableRoles: Role[];
  galleryItems: GalleryItem[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Full Name</label>
                <input
                  name="fullName"
                  required
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">Initials</label>
                <input
                  name="initials"
                  maxLength={3}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-center font-mono font-bold uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="ABC"
                  onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Profile Photo
              </label>
              <ImagePicker
                value={selectedPhoto}
                onChange={setSelectedPhoto}
                galleryItems={galleryItems}
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

            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-left">
                Organizational Roles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="roleIds"
                      value={role.id}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="text-xs font-medium truncate">{role.name}</span>
                  </label>
                ))}
                {availableRoles.length === 0 && (
                  <p className="text-xs text-muted-foreground italic col-span-2">
                    No roles created yet. Add them in Roles tab first.
                  </p>
                )}
              </div>
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
