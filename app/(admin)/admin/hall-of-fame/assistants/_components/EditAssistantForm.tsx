"use client";

import { useState, useTransition } from "react";
import { Pencil, AlertCircle, Trash2, Tag, User, Globe, Shield } from "lucide-react";
import {
  updateAssistantProfileAction,
  deleteAssistantProfileAction,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ImagePicker } from "@/components/ImagePicker";

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

interface GalleryItem {
  id: string;
  title: string | null;
  filePath: string;
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
  initials: string | null;
  profilePhotoPath: string | null;
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
  galleryItems: GalleryItem[];
}

export function EditAssistantForm({
  assistant,
  generations,
  currentRoles,
  availableRoles,
  usersForLinking,
  galleryItems,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(assistant.profilePhotoPath);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles.map(r => r.roleId));

  function handleOpenChange(v: boolean) {
    if (v) {
      setSelectedPhoto(assistant.profilePhotoPath);
      setSelectedRoles(currentRoles.map(r => r.roleId));
      setError(null);
    }
    setOpen(v);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      // Add roles to formData
      selectedRoles.forEach(roleId => {
        formData.append("roleIds", roleId);
      });
      // If no roles selected but we want to clear them, we need a way to tell the server.
      // The server action now checks for existence of 'roleIds' key.
      if (selectedRoles.length === 0) {
          formData.append("roleIds", ""); // This signals intent to clear
      }

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
      <DialogContent className="sm:max-w-xl">
        <form action={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
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
            <DialogDescription>{assistant.fullName}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-2">
                <User className="h-3.5 w-3.5" /> General
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <Globe className="h-3.5 w-3.5" /> Social
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-3.5 w-3.5" /> Roles
              </TabsTrigger>
            </TabsList>

            <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
              <TabsContent value="general" forceMount className="space-y-4 pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <input
                      name="fullName"
                      required
                      defaultValue={assistant.fullName}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Initials</label>
                    <input
                      name="initials"
                      maxLength={3}
                      defaultValue={assistant.initials ?? ""}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-center font-mono font-bold uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="ABC"
                      onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Profile Photo</label>
                  <ImagePicker
                    value={selectedPhoto}
                    onChange={setSelectedPhoto}
                    galleryItems={galleryItems}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Generation</label>
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Status</label>
                    <select
                      name="status"
                      defaultValue={assistant.status}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="alumni">Alumni</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Joined Year</label>
                    <input
                      name="joinedYear"
                      type="number"
                      defaultValue={assistant.joinedYear}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">End Year</label>
                    <input
                      name="endYear"
                      type="number"
                      defaultValue={assistant.endYear ?? ""}
                      placeholder="optional"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Link User Account</label>
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
              </TabsContent>

              <TabsContent value="social" forceMount className="space-y-4 pt-0">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">GitHub URL</label>
                  <input
                    name="githubUrl"
                    type="url"
                    defaultValue={assistant.githubUrl ?? ""}
                    placeholder="https://github.com/..."
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Instagram URL</label>
                  <input
                    name="instagramUrl"
                    type="url"
                    defaultValue={assistant.instagramUrl ?? ""}
                    placeholder="https://instagram.com/..."
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">LinkedIn URL</label>
                  <input
                    name="linkedinUrl"
                    type="url"
                    defaultValue={assistant.linkedinUrl ?? ""}
                    placeholder="https://linkedin.com/in/..."
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </TabsContent>

              <TabsContent value="roles" forceMount className="space-y-4 pt-0">
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">Organizational Roles</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableRoles.map((role) => (
                      <label
                        key={role.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                          selectedRoles.includes(role.id)
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-background hover:bg-muted"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role.id]);
                            } else {
                              setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="text-xs font-medium truncate">{role.name}</span>
                      </label>
                    ))}
                    {availableRoles.length === 0 && (
                      <p className="text-xs text-muted-foreground italic col-span-2">
                        No roles defined yet.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <DialogFooter className="mt-4">
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
