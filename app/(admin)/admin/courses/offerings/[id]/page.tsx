import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  FlaskConical,
  BookMarked,
  CheckCircle2,
  Clock,
  FileEdit,
  Archive,
  Globe,
  Lock,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  courseOfferings,
  courses,
  enrollments,
  users,
  modules,
  contentItems,
  offeringAssistants,
  groups,
} from "@/lib/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { cn } from "@/lib/utils";
import {
  OfferingTabs,
  type OfferingTabsData,
} from "./_components/OfferingTabs";
import { EditOfferingForm } from "./_components/EditOfferingForm";

// ─── Status config ────────────────────────────────────────────────────────────

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

// ─── Page metadata ────────────────────────────────────────────────────────────

export const metadata: Metadata = { title: "Manage Offering | Admin" };

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OfferingManagePage({ params }: PageProps) {
  const { id } = await params;

  // 1. Get offering with course
  const [row] = await db
    .select({
      offering: courseOfferings,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
        type: courses.type,
      },
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(courseOfferings.id, id))
    .limit(1);

  if (!row) notFound();

  const { offering, course } = row;

  // 2. Enrollment count
  const [{ enrollmentCount }] = await db
    .select({ enrollmentCount: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.offeringId, id));

  // 3. Students with groups
  const studentRows = await db
    .select({
      enrollmentId: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      jurusan: enrollments.jurusan,
      kelas: enrollments.kelas,
      kelompokCsv: enrollments.kelompokCsv,
      studentId: users.id,
      studentName: users.name,
      studentNim: users.nim,
      studentEmail: users.email,
      groupNumber: groups.number,
      groupName: groups.name,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .leftJoin(groups, eq(enrollments.groupId, groups.id))
    .where(eq(enrollments.offeringId, id))
    .orderBy(users.name);

  // 4. Modules
  const mods = await db
    .select()
    .from(modules)
    .where(eq(modules.offeringId, id))
    .orderBy(asc(modules.orderIndex));

  // 5. Content counts per module
  const contentCountsRaw = await db
    .select({
      moduleId: contentItems.moduleId,
      count: sql<number>`count(*)`,
    })
    .from(contentItems)
    .groupBy(contentItems.moduleId);

  const contentCountMap = new Map(
    contentCountsRaw.map((r) => [r.moduleId, Number(r.count)]),
  );

  const modulesWithCount = mods.map((m) => ({
    ...m,
    contentCount: contentCountMap.get(m.id) ?? 0,
  }));

  // 6. Available assistant users
  const availableAssistantUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["assistant", "super_admin"]))
    .orderBy(users.name);

  // 7. Assigned assistants (assistantId references users.id)
  const assistantRows = await db
    .select({
      id: offeringAssistants.id,
      assistantId: offeringAssistants.assistantId,
      isLead: offeringAssistants.isLead,
      assistantName: users.name,
      assistantEmail: users.email,
    })
    .from(offeringAssistants)
    .innerJoin(users, eq(offeringAssistants.assistantId, users.id))
    .where(eq(offeringAssistants.offeringId, id))
    .orderBy(offeringAssistants.isLead);

  // ─── Compose tabs data ─────────────────────────────────────────────────────

  const tabsData: OfferingTabsData = {
    offering: {
      id: offering.id,
      semester: offering.semester,
      academicYear: offering.academicYear,
      hari: offering.hari,
      shift: offering.shift,
      status: offering.status,
      visibility: offering.visibility,
      enrollmentKey: offering.enrollmentKey,
    },
    course,
    enrollmentCount: Number(enrollmentCount),
    students: studentRows,
    modules: modulesWithCount,
    assistants: assistantRows,
    availableAssistants: availableAssistantUsers,
  };

  // ─── Status badge ──────────────────────────────────────────────────────────

  const statusCfg = STATUS_CONFIG[offering.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.Icon;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/admin/courses"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Courses
        </Link>
        <span>/</span>
        <span className="text-foreground">{course.name}</span>
        <span>/</span>
        <span>{offering.semester}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* Course type + code */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                course.type === "praktikum"
                  ? "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {course.type === "praktikum" ? (
                <FlaskConical className="h-2.5 w-2.5" />
              ) : (
                <BookMarked className="h-2.5 w-2.5" />
              )}
              {course.type === "praktikum" ? "Practicum" : "Study Group"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {course.code}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
            {course.name}
          </h1>

          {/* Offering meta */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Status */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                statusCfg.className,
              )}
            >
              <StatusIcon className="h-2.5 w-2.5" />
              {statusCfg.label}
            </span>

            {/* Semester */}
            <span className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {offering.semester} · {offering.academicYear}
            </span>

            {/* Schedule */}
            {(offering.hari || offering.shift) && (
              <span className="text-xs">
                {[offering.hari, offering.shift].filter(Boolean).join(" · ")}
              </span>
            )}

            {/* Enrollment count */}
            <span className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              {Number(enrollmentCount)} student{Number(enrollmentCount) !== 1 ? "s" : ""}
            </span>

            {/* Visibility */}
            <span className="flex items-center gap-1 text-xs">
              {offering.visibility === "public" ? (
                <>
                  <Globe className="h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Internal
                </>
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <EditOfferingForm offering={tabsData.offering} />
      </div>

      {/* Tabs */}
      <OfferingTabs data={tabsData} />
    </div>
  );
}
