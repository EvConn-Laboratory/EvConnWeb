"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
  Users,
  FileEdit,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react";
import { createOfferingAction } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  name: string;
  code: string;
  type: "praktikum" | "study_group";
}

interface OfferingWithCount {
  id: string;
  courseId: string;
  semester: string;
  academicYear: string;
  hari: string | null;
  shift: string | null;
  status: "draft" | "active" | "closed" | "archived";
  visibility: "internal" | "public";
  enrollmentCount: number;
}

interface CourseOfferingsManagerProps {
  course: Course;
  offerings: OfferingWithCount[];
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    Icon: FileEdit,
  },
  active: {
    label: "Active",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    Icon: CheckCircle,
  },
  closed: {
    label: "Closed",
    className:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    Icon: Clock,
  },
  archived: {
    label: "Archived",
    className: "bg-muted/60 text-muted-foreground border-border",
    Icon: Archive,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = config.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

// ─── Select class ─────────────────────────────────────────────────────────────

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseOfferingsManager({
  course,
  offerings: initialOfferings,
}: CourseOfferingsManagerProps) {
  const [offerings, setOfferings] =
    useState<OfferingWithCount[]>(initialOfferings);

  // Form state
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [hari, setHari] = useState("");
  const [shift, setShift] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [visibility, setVisibility] = useState<string>("internal");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setSemester("");
    setAcademicYear("");
    setHari("");
    setShift("");
    setStatus("draft");
    setVisibility("internal");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!semester.trim()) {
      setError("Semester is required.");
      return;
    }
    if (!academicYear.trim()) {
      setError("Academic year is required.");
      return;
    }

    const fd = new FormData();
    fd.append("courseId", course.id);
    fd.append("semester", semester.trim());
    fd.append("academicYear", academicYear.trim());
    if (hari) fd.append("hari", hari);
    if (shift.trim()) fd.append("shift", shift.trim());
    fd.append("status", status);
    fd.append("visibility", visibility);

    startTransition(async () => {
      const res = await createOfferingAction(null, fd);

      if ("error" in res) {
        setError(res.error);
        return;
      }

      setSuccess("Offering created successfully.");
      resetForm();

      // Optimistically append a placeholder row; the page will revalidate
      if (res.id) {
        setOfferings((prev) => [
          {
            id: res.id!,
            courseId: course.id,
            semester: semester.trim(),
            academicYear: academicYear.trim(),
            hari: hari || null,
            shift: shift.trim() || null,
            status: status as OfferingWithCount["status"],
            visibility: visibility as OfferingWithCount["visibility"],
            enrollmentCount: 0,
          },
          ...prev,
        ]);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left: Add offering form ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-5 text-sm font-semibold text-foreground">
          Create New Offering
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Semester */}
          <div className="space-y-1.5">
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              name="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. Odd"
              required
            />
          </div>

          {/* Academic Year */}
          <div className="space-y-1.5">
            <Label htmlFor="academicYear">Academic Year</Label>
            <Input
              id="academicYear"
              name="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2024/2025"
              required
            />
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <Label htmlFor="hari">
              Day{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <select
              id="hari"
              name="hari"
              value={hari}
              onChange={(e) => setHari(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">— Select day —</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <Label htmlFor="shift">
              Shift{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="shift"
              name="shift"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              placeholder="e.g. 1, 2, or Morning"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              name="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="internal">Internal</option>
              <option value="public">Public</option>
            </select>
          </div>

          {/* Feedback */}
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {success}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className={cn(isPending && "opacity-60")}
            >
              {isPending ? "Creating..." : "Create Offering"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Right: Existing offerings ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Existing Offerings
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {offerings.length === 0
              ? "No offerings yet"
              : `${offerings.length} offering${offerings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {offerings.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No offerings for this course yet. Create the first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Semester
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Schedule
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Students
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offerings.map((offering) => (
                  <tr
                    key={offering.id}
                    className="transition-colors hover:bg-muted/20"
                  >
                    {/* Semester */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground leading-snug">
                        {offering.semester}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {offering.academicYear}
                      </p>
                    </td>

                    {/* Schedule */}
                    <td className="px-4 py-3">
                      {offering.hari || offering.shift ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {[offering.hari, offering.shift]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={offering.status} />
                    </td>

                    {/* Enrollment count */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3 shrink-0" />
                        {offering.enrollmentCount}
                      </span>
                    </td>

                    {/* View link */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/courses/offerings/${offering.id}`}
                        className="flex items-center justify-end gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                      >
                        Manage
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
