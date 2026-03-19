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

  function handleOpen() {
    setLocalRoles(currentRoles);
    setSelectedRoleId("");
    setError(null);
    setRoleError(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setRoleError(null);
  }

  function handleAddRole() {
    if (!selectedRoleId) return;
    const role = availableRoles.find((r) => r.id === selectedRoleId);
    if (!role) return;
    setRoleError(null);
    startAddRole(async () => {
      const res = await assignRoleToAssistantAction(assistant.id, selectedRoleId);
      if ("error" in res) {
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
      if ("error" in res) {
        setRoleError(res.error);
        return;
      }
      setLocalRoles((prev) => prev.filter((r) => r.roleId !== roleId));
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateAssistantProfileAction(assistant.id, null, formData);
      if ("error" in res) {
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
      if ("error" in res) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="xs"
        className="gap-1"
        onClick={handleOpen}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>

      {open && (
        <form
          action={handleSubmit}
          className="w-80 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Edit — {assistant.fullName}</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "…" : "Delete"}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <input
              name="fullName"
              required
              defaultValue={assistant.fullName}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Link to User Account <span className="text-muted-foreground">(optional)</span>
            </label>
            <select
              name="userId"
              defaultValue={assistant.userId ?? ""}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">— No link —</option>
              {usersForLinking.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Links this profile to a user so they appear in Users and can be assigned to offerings.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Generation</label>
            <select
              name="generationId"
              required
              defaultValue={assistant.generationId}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
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
              <label className="text-xs font-medium text-foreground">Joined Year</label>
              <input
                name="joinedYear"
                type="number"
                min={2000}
                max={2100}
                required
                defaultValue={assistant.joinedYear}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">End Year</label>
              <input
                name="endYear"
                type="number"
                min={2000}
                max={2100}
                defaultValue={assistant.endYear ?? ""}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="optional"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Status</label>
            <select
              name="status"
              defaultValue={assistant.status}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="active">Active</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              GitHub URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              name="githubUrl"
              type="url"
              defaultValue={assistant.githubUrl ?? ""}
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
              defaultValue={assistant.instagramUrl ?? ""}
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
              defaultValue={assistant.linkedinUrl ?? ""}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          {/* ── Organizational Roles ─────────────────────────────── */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
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
                  className="h-8 flex-1 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="">Add a role…</option>
                  {unassignedRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddRole}
                  disabled={!selectedRoleId || isAddingRole}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors",
                    (!selectedRoleId || isAddingRole) && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Plus className="h-3 w-3" />
                  {isAddingRole ? "…" : "Add"}
                </button>
              </div>
            )}

            {availableRoles.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60 italic">
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

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
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
              {isPending ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
