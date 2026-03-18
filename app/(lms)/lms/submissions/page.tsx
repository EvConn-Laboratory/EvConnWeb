import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getOfferingsByAssistantAction } from "@/lib/actions/courses";
import { getGroupSubmissionsForAssistantAction } from "@/lib/actions/phase2";
import { db } from "@/lib/db";
import { courseOfferings, courses } from "@/lib/db/schema";
import { ClipboardList, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Submissions — EvConn LMS" };

type Search = { offeringId?: string };

export default async function AssistantSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    redirect("/lms/dashboard");
  }

  const offerings =
    session.user.role === "assistant"
      ? await getOfferingsByAssistantAction(session.user.id)
      : await db
          .select({ offering: courseOfferings, course: courses })
          .from(courseOfferings)
          .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
          .orderBy(desc(courseOfferings.createdAt));

  const { offeringId } = await searchParams;
  const activeOfferingId = offeringId ?? offerings[0]?.offering.id ?? null;

  const submissions = activeOfferingId
    ? await getGroupSubmissionsForAssistantAction(activeOfferingId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Group Submissions</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review pengumpulan tugas kolaboratif per offering.
        </p>
      </div>

      {offerings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {offerings.map(({ offering, course }) => {
            const href = `/lms/submissions?offeringId=${offering.id}`;
            const active = offering.id === activeOfferingId;
            return (
              <Link
                key={offering.id}
                href={href}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {course.code} · {offering.semester} {offering.academicYear}
              </Link>
            );
          })}
        </div>
      )}

      {!activeOfferingId ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Belum ada offering yang tersedia.
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Belum ada group submission pada offering ini.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{sub.assignmentTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Modul {sub.moduleOrder + 1} · {sub.moduleTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kelompok {sub.groupNumber}
                    {sub.groupName ? ` (${sub.groupName})` : ""}
                    {" · "}
                    Pengumpul: {sub.submitterName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sub.submittedAt).toLocaleString("id-ID")}
                    {sub.isLate ? " · Terlambat" : ""}
                    {` · v${sub.version}`}
                  </p>
                  {sub.textAnswer && (
                    <p className="mt-1 line-clamp-3 text-xs text-foreground/80">{sub.textAnswer}</p>
                  )}
                </div>

                {sub.filePath ? (
                  <a
                    href={sub.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-primary hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" />
                    File
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
