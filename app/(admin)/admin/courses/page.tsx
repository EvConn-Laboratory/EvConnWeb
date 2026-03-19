import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  Calendar,
  Users,
  Layers,
  FlaskConical,
  BookMarked,
  Clock,
  CheckCircle2,
  Archive,
  FileEdit,
} from "lucide-react";
import { getAllCoursesAction } from "@/lib/actions/courses";
import { db } from "@/lib/db";
import { courseOfferings, enrollments } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Course Management | Admin" };

import { AddCourseForm } from "./_components/AddCourseForm";
import { EditCourseForm } from "./_components/EditCourseForm";
// ─── Status badge config ─────────────────────────────────────────────────────

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
    Icon: CheckCircle2,
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

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const isPraktikum = type === "praktikum";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        isPraktikum
          ? "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      )}
    >
      {isPraktikum ? (
        <FlaskConical className="h-2.5 w-2.5" />
      ) : (
        <BookMarked className="h-2.5 w-2.5" />
      )}
      {isPraktikum ? "Practicum" : "Study Group"}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

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

// ─── Course card ──────────────────────────────────────────────────────────────

interface OfferingWithCount {
  id: string;
  courseId: string;
  semester: string;
  academicYear: string;
  hari: string | null;
  shift: string | null;
  status: "draft" | "active" | "closed" | "archived";
  visibility: "internal" | "public";
  createdAt: Date;
  updatedAt: Date;
  enrollmentKey: string | null;
  enrollmentCount: number;
}

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    type: "praktikum" | "study_group";
    isActive: boolean;
    createdAt: Date;
  };
  offerings: OfferingWithCount[];
}

function CourseCard({ course, offerings }: CourseCardProps) {
  const activeCount = offerings.filter((o) => o.status === "active").length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Course header */}
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-medium text-muted-foreground">
                {course.code}
              </span>
              <TypeBadge type={course.type} />
              {!course.isActive && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
              {course.name}
            </h3>
            {course.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {course.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <EditCourseForm course={course} />
            <Button variant="outline" size="xs" asChild className="gap-1">
              <Link href={`/admin/courses/${course.id}/edit`}>
                <Plus className="h-3 w-3" />
                Add Offering
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {offerings.length} offering
          </span>
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              {activeCount} active
            </span>
          )}
        </div>
      </div>

      {/* Offerings list */}
      {offerings.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-muted-foreground">
          No offerings for this course yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {offerings.map((offering) => (
            <OfferingRow key={offering.id} offering={offering} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Offering row ─────────────────────────────────────────────────────────────

function OfferingRow({ offering }: { offering: OfferingWithCount }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/20">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div>
          <p className="font-medium text-foreground leading-snug">
            {offering.semester}
          </p>
          <p className="text-xs text-muted-foreground">{offering.academicYear}</p>
        </div>

        {/* Schedule */}
        {(offering.hari || offering.shift) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            {[offering.hari, offering.shift].filter(Boolean).join(" · ")}
          </span>
        )}

        <StatusBadge status={offering.status} />

        {/* Enrollment count */}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3 shrink-0" />
          {offering.enrollmentCount} student{offering.enrollmentCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Detail link */}
      <Link
        href={`/admin/courses/offerings/${offering.id}`}
        className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
      >
        Manage
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCoursesPage() {
  // Fetch courses (uses staff auth guard internally)
  const courses = await getAllCoursesAction();

  // Fetch all offerings
  const allOfferings = await db
    .select()
    .from(courseOfferings)
    .orderBy(desc(courseOfferings.createdAt));

  // Fetch enrollment counts per offering
  const enrollmentCountsRaw = await db
    .select({
      offeringId: enrollments.offeringId,
      count: sql<number>`count(*)`,
    })
    .from(enrollments)
    .groupBy(enrollments.offeringId);

  const enrollmentCountMap = new Map(
    enrollmentCountsRaw.map((r) => [r.offeringId, Number(r.count)]),
  );

  // Group offerings by course
  const offeringsByCourse = new Map<string, OfferingWithCount[]>();
  for (const offering of allOfferings) {
    const list = offeringsByCourse.get(offering.courseId) ?? [];
    list.push({
      ...offering,
      enrollmentCount: enrollmentCountMap.get(offering.id) ?? 0,
    });
    offeringsByCourse.set(offering.courseId, list);
  }

  const totalOfferings = allOfferings.length;
  const activeOfferings = allOfferings.filter((o) => o.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Course Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? "s" : ""} · {totalOfferings} offering{totalOfferings !== 1 ? "s" : ""} ·{" "}
            <span className="text-green-600 dark:text-green-400">
              {activeOfferings} active
            </span>
          </p>
        </div>

        {/* Add course */}
        <AddCourseForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Courses",
            value: courses.length,
            icon: BookOpen,
            accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            label: "Total Offerings",
            value: totalOfferings,
            icon: Layers,
            accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          },
          {
            label: "Active Offerings",
            value: activeOfferings,
            icon: CheckCircle2,
            accent: "bg-green-500/10 text-green-600 dark:text-green-400",
          },
          {
            label: "Total Students",
            value: Array.from(enrollmentCountMap.values()).reduce(
              (a, b) => a + b,
              0,
            ),
            icon: Users,
            accent: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                stat.accent,
              )}
            >
              <stat.icon className="h-4.5 w-4.5" size={18} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-foreground">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Course cards */}
      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No courses yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first course or import from CSV.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              offerings={offeringsByCourse.get(course.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
