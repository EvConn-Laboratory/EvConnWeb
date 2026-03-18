import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getModulesByOfferingAction } from "@/lib/actions/modules";
import { db } from "@/lib/db";
import {
  courseOfferings,
  courses,
  moduleCompletions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ModuleList } from "./ModuleList";

export const metadata = { title: "Detail Mata Kuliah" };

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch offering + course details
  const [row] = await db
    .select({ offering: courseOfferings, course: courses })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(courseOfferings.id, id))
    .limit(1);

  if (!row) notFound();

  const { offering, course } = row;

  // Fetch ordered modules for this offering
  const moduleList = await getModulesByOfferingAction(id);

  // Fetch completion status for each module (for the current student)
  const completionRows = await db
    .select({
      moduleId: moduleCompletions.moduleId,
      isComplete: moduleCompletions.isComplete,
    })
    .from(moduleCompletions)
    .where(eq(moduleCompletions.studentId, session.user.id));

  const completionMap = new Map(
    completionRows.map((r) => [r.moduleId, r.isComplete]),
  );

  const completedCount = moduleList.filter(
    (m) => completionMap.get(m.id) === true,
  ).length;

  const enrichedModules = moduleList.map((m) => ({
    ...m,
    isComplete: completionMap.get(m.id) ?? false,
    // Dates need to be serialized for client component
    openDatetime: m.openDatetime ? m.openDatetime.toISOString() : null,
    closeDatetime: m.closeDatetime ? m.closeDatetime.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/lms/courses" className="hover:text-foreground transition-colors">
          Mata Kuliah
        </Link>
        <span>/</span>
        <span className="text-foreground">{course.name}</span>
      </nav>

      {/* Course header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={
                  course.type === "praktikum"
                    ? "inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400"
                    : "inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400"
                }
              >
                {course.type === "praktikum" ? "Praktikum" : "Study Group"}
              </span>
              <span className="text-xs text-muted-foreground">{course.code}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {course.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {offering.semester} {offering.academicYear}
              {offering.hari
                ? ` · ${offering.hari}${offering.shift ? `, ${offering.shift}` : ""}`
                : ""}
            </p>
          </div>

          {/* Progress summary */}
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-foreground">
              {completedCount}
              <span className="text-base font-normal text-muted-foreground">
                /{moduleList.length}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">modul selesai</p>
          </div>
        </div>

        {/* Progress bar */}
        {moduleList.length > 0 && (
          <div className="mt-4 space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${Math.round((completedCount / moduleList.length) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {Math.round((completedCount / moduleList.length) * 100)}% selesai
            </p>
          </div>
        )}
      </div>

      {/* Module list */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Daftar Modul
        </h2>
        {moduleList.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada modul untuk mata kuliah ini.
            </p>
          </div>
        ) : (
          <ModuleList modules={enrichedModules} offeringId={id} />
        )}
      </section>
    </div>
  );
}
