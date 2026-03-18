"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserRound,
  Crown,
  GraduationCap,
  CheckCircle2,
  Clock,
  FileEdit,
  Archive,
  Plus,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createModuleAction } from "@/lib/actions/modules";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferingTabsData {
  offering: {
    id: string;
    semester: string;
    academicYear: string;
    hari: string | null;
    shift: string | null;
    status: string;
    visibility: string;
    enrollmentKey: string | null;
  };
  course: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  enrollmentCount: number;
  students: Array<{
    enrollmentId: string;
    enrolledAt: Date;
    jurusan: string | null;
    kelas: string | null;
    kelompokCsv: string | null;
    studentId: string;
    studentName: string;
    studentNim: string | null;
    studentEmail: string | null;
    groupNumber: number | null;
    groupName: string | null;
  }>;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    orderIndex: number;
    status: string;
    openDatetime: Date | null;
    closeDatetime: Date | null;
    contentCount: number;
  }>;
  assistants: Array<{
    id: string;
    assistantId: string;
    isLead: boolean;
    assistantName: string;
    assistantEmail: string | null;
  }>;
}

type TabId = "overview" | "students" | "modules" | "assistants";

// ─── Module status badge ──────────────────────────────────────────────────────

const MODULE_STATUS: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    Icon: FileEdit,
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Icon: Clock,
  },
  open: {
    label: "Open",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    Icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    className:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    Icon: Archive,
  },
};

function ModuleStatusBadge({ status }: { status: string }) {
  const cfg = MODULE_STATUS[status] ?? MODULE_STATUS.draft;
  const Icon = cfg.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        cfg.className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Content count ────────────────────────────────────────────────────────────

function ContentCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <BookOpen className="h-3 w-3" />
      {count} content item{count !== 1 ? "s" : ""}
    </span>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: OfferingTabsData }) {
  const openModules = data.modules.filter((m) => m.status === "open").length;

  const stats = [
    {
      label: "Total Students",
      value: data.enrollmentCount,
      icon: GraduationCap,
      accent: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      label: "Total Modules",
      value: data.modules.length,
      icon: BookOpen,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Active Modules",
      value: openModules,
      icon: CheckCircle2,
      accent: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      label: "Assistants",
      value: data.assistants.length,
      icon: UserRound,
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                s.accent,
              )}
            >
              <s.icon className="h-4 w-4" size={16} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-foreground">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Offering info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Offering Info
          </h3>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Semester", value: data.offering.semester },
              { label: "Academic Year", value: data.offering.academicYear },
              {
                label: "Day",
                value: data.offering.hari ?? "—",
              },
              {
                label: "Shift",
                value: data.offering.shift ?? "—",
              },
              { label: "Visibility", value: data.offering.visibility },
              {
                label: "Enrollment Key",
                value: data.offering.enrollmentKey ?? (
                  <span className="text-muted-foreground">None</span>
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Module summary */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Module Summary
          </h3>
          {data.modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No modules for this offering yet.
            </p>
          ) : (
            <div className="space-y-2">
              {data.modules.slice(0, 5).map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="truncate text-sm text-foreground">
                    {mod.orderIndex + 1}. {mod.title}
                  </p>
                  <ModuleStatusBadge status={mod.status} />
                </div>
              ))}
              {data.modules.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{data.modules.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Students tab ─────────────────────────────────────────────────────────────

function StudentsTab({
  students,
}: {
  students: OfferingTabsData["students"];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">
          {students.length} student{students.length !== 1 ? "s" : ""} enrolled
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Name
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                NIM
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Major / Class
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Group
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Enrolled
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No students enrolled yet.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.enrollmentId} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{s.studentName}</p>
                    {s.studentEmail && (
                      <p className="text-xs text-muted-foreground">
                        {s.studentEmail}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {s.studentNim ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {[s.jurusan, s.kelas].filter(Boolean).join(" / ") || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.groupNumber != null ? (
                      <span className="inline-flex items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-600 dark:text-teal-400">
                        Group {s.groupNumber}
                        {s.groupName ? ` · ${s.groupName}` : ""}
                      </span>
                    ) : s.kelompokCsv ? (
                      <span className="text-xs text-muted-foreground">
                        {s.kelompokCsv}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.enrolledAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Add Module form ──────────────────────────────────────────────────────────

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type ModuleRow = OfferingTabsData["modules"][number];

function AddModuleForm({
  offeringId,
  nextOrder,
  onCreated,
}: {
  offeringId: string;
  nextOrder: number;
  onCreated: (mod: ModuleRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndex, setOrderIndex] = useState(String(nextOrder));
  const [status, setStatus] = useState("draft");
  const [openDatetime, setOpenDatetime] = useState("");
  const [closeDatetime, setCloseDatetime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
    setOrderIndex(String(nextOrder));
    setStatus("draft");
    setOpenDatetime("");
    setCloseDatetime("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.append("offeringId", offeringId);
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("orderIndex", orderIndex);
    fd.append("status", status);
    if (openDatetime) fd.append("openDatetime", openDatetime);
    if (closeDatetime) fd.append("closeDatetime", closeDatetime);

    startTransition(async () => {
      const res = await createModuleAction(null, fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onCreated({
        id: res.id ?? crypto.randomUUID(),
        title: title.trim(),
        description: description.trim() || null,
        orderIndex: Number(orderIndex),
        status,
        openDatetime: openDatetime ? new Date(openDatetime) : null,
        closeDatetime: closeDatetime ? new Date(closeDatetime) : null,
        contentCount: 0,
      });
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Add Module
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Add Module</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="mod-title">Title</Label>
          <Input
            id="mod-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Networks"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mod-description">
            Description{" "}
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="mod-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mod-order">Order</Label>
            <Input
              id="mod-order"
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-status">Status</Label>
            <select
              id="mod-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mod-open">
              Opens At{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="mod-open"
              type="datetime-local"
              value={openDatetime}
              onChange={(e) => setOpenDatetime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-close">
              Closes At{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="mod-close"
              type="datetime-local"
              value={closeDatetime}
              onChange={(e) => setCloseDatetime(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { reset(); setOpen(false); }}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Creating..." : "Create Module"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Modules tab ──────────────────────────────────────────────────────────────

function ModulesTab({
  modules: initialModules,
  offeringId,
}: {
  modules: OfferingTabsData["modules"];
  offeringId: string;
}) {
  const [modules, setModules] = useState(initialModules);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <AddModuleForm
          offeringId={offeringId}
          nextOrder={modules.length}
          onCreated={(mod) => setModules((prev) => [...prev, mod])}
        />
      </div>

      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <BookOpen className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No modules yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a module to this offering using the button above.
          </p>
        </div>
      ) : (
        modules.map((mod) => (
          <div
            key={mod.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/20"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Order number */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                {mod.orderIndex + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground leading-snug">
                    {mod.title}
                  </p>
                  <ModuleStatusBadge status={mod.status} />
                </div>
                {mod.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {mod.description}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <ContentCount count={mod.contentCount} />
                  {mod.openDatetime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Opens:{" "}
                      {new Date(mod.openDatetime).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href={`/admin/courses/offerings/${offeringId}/modules/${mod.id}`}
              className="shrink-0"
            >
              <Button variant="outline" size="xs">
                Manage
              </Button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Assistants tab ───────────────────────────────────────────────────────────

function AssistantsTab({
  assistants,
}: {
  assistants: OfferingTabsData["assistants"];
}) {
  return (
    <div className="space-y-3">
      {assistants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <UserRound className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No assistants assigned
          </p>
        </div>
      ) : (
        assistants.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {a.assistantName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {a.assistantName}
                  </p>
                  {a.isLead && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <Crown className="h-2.5 w-2.5" />
                      Lead
                    </span>
                  )}
                </div>
                {a.assistantEmail && (
                  <p className="text-xs text-muted-foreground">
                    {a.assistantEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main Tabs Component ──────────────────────────────────────────────────────

export function OfferingTabs({ data }: { data: OfferingTabsData }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: Array<{
    id: TabId;
    label: string;
    icon: React.ElementType;
    count?: number;
  }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "students",
      label: "Students",
      icon: GraduationCap,
      count: data.enrollmentCount,
    },
    {
      id: "modules",
      label: "Modules",
      icon: BookOpen,
      count: data.modules.length,
    },
    {
      id: "assistants",
      label: "Assistants",
      icon: UserRound,
      count: data.assistants.length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "students" && <StudentsTab students={data.students} />}
      {activeTab === "modules" && (
        <ModulesTab
          modules={data.modules}
          offeringId={data.offering.id}
        />
      )}
      {activeTab === "assistants" && (
        <AssistantsTab assistants={data.assistants} />
      )}
    </div>
  );
}
