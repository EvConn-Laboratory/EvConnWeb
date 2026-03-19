"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2, X, Plus, Tag } from "lucide-react";
import {
  updateAssistantProfileAction,
  deleteAssistantProfileAction,
  assignRoleToAssistantAction,
  removeRoleFromAssistantAction,
} from "@/lib/actions/personnel";
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

interface OrgRole {
  id: string;
  name: string;
  sortOrder: number;
}

interface AssignedRole {
  roleId: string;
  roleName: string;
  sortOrder: number;
}

interface AssistantRow {
  id: string;
  userId: string | null;
  fullName: string;
  generationId: string;
  joinedYear: number;
  endYear: number | null;
  status: "active" | "alumni";
  githubUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
}

interface UserForLinking {
  id: string;
  name: string;
  email: string | null;
}

interface Props {
  assistant: AssistantRow;
  generations: Generation[];
  currentRoles: AssignedRole[];
  availableRoles: OrgRole[];
  usersForLinking: UserForLinking[];
}

export function EditAssistantForm({ assistant, generations, currentRoles, availableRoles, usersForLinking }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // Local role state — optimistic, batched with profile save
  const [localRoles, setLocalRoles] = useState<AssignedRole[]>(currentRoles);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isAddingRole, startAddRole] = useTransition();
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);

  const unassignedRoles = availableRoles.filter(
    (r) => !localRoles.some((lr) => lr.roleId === r.id),
  );

  function handleOpenChange(v: boolean) {
    if (v) {
      setLocalRoles(currentRoles);
      setSelectedRoleId("");
      setError(null);
      setRoleError(null);
    }
    setOpen(v);
  }

  function handleAddRole() {
    if (!selectedRoleId) return;
    const role = availableRoles.find((r) => r.id === selectedRoleId);
    if (!role) return;
    setRoleError(null);
    startAddRole(async () => {
      const res = await assignRoleToAssistantAction(assistant.id, selectedRoleId);
      if (res && "error" in res) {
        setRoleError(res.error);
        return;
      }
      setLocalRoles((prev) =>
        [...prev, { roleId: role.id, roleName: role.name, sortOrder: role.sortOrder }].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        ),
      );
      setSelectedRoleId("");
    });
  }

  function handleRemoveRole(roleId: string) {
    setRoleError(null);
    setRemovingRoleId(roleId);
    startTransition(async () => {
      const res = await removeRoleFromAssistantAction(assistant.id, roleId);
      setRemovingRoleId(null);
      if (res && "error" in res) {
        setRoleError(res.error);
        return;
      }
      setLocalRoles((prev) => prev.filter((r) => r.roleId !== roleId));
    });
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateAssistantProfileAction(assistant.id, null, formData);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${assistant.fullName}"? This cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteAssistantProfileAction(assistant.id);
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" className="gap-1">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Profile</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {isDeleting ? "..." : "Delete"}
              </Button>
            </div>
            <DialogDescription>
              {assistant.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Full Name</label>
              <input
                name="fullName"
                required
                defaultValue={assistant.fullName}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                Link to User Account <span className="text-muted-foreground">(optional)</span>
              </label>
              <select
                name="userId"
                defaultValue={assistant.userId ?? ""}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— No link —</option>
                {usersForLinking.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Generation</label>
              <select
                name="generationId"
                required
                defaultValue={assistant.generationId}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
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
                  defaultValue={assistant.joinedYear}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block text-left">End Year</label>
                <input
                  name="endYear"
                  type="number"
                  min={2000}
                  max={2100}
                  defaultValue={assistant.endYear ?? ""}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="optional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">Status</label>
              <select
                name="status"
                defaultValue={assistant.status}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block text-left">
                GitHub URL <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                name="githubUrl"
                type="url"
                defaultValue={assistant.githubUrl ?? ""}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                defaultValue={assistant.instagramUrl ?? ""}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                defaultValue={assistant.linkedinUrl ?? ""}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            {/* ── Organizational Roles ─────────────────────────────── */}
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">Organizational Roles</p>
              </div>

              {/* Current roles */}
              <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {localRoles.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground/60 italic">No roles assigned</span>
                ) : (
                  localRoles.map((r) => (
                    <span
                      key={r.roleId}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 pl-2 pr-1 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400"
                    >
                      {r.roleName}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(r.roleId)}
                        disabled={removingRoleId === r.roleId || isPending}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                        title={`Remove ${r.roleName}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add role */}
              {unassignedRoles.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Add a role…</option>
                    {unassignedRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRole}
                    disabled={!selectedRoleId || isAddingRole}
                    className="h-9"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {isAddingRole ? "..." : "Add"}
                  </Button>
                </div>
              )}

              {availableRoles.length === 0 && (
                <p className="text-[11px] text-muted-foreground/60 italic text-left">
                  No organizational roles defined yet.{" "}
                  <a href="/admin/hall-of-fame/roles" className="text-primary underline underline-offset-2">
                    Create roles first.
                  </a>
                </p>
              )}

              {roleError && (
                <p className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {roleError}
                </p>
              )}
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
              {isPending ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
