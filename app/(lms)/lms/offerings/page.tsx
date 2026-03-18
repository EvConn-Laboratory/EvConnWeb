import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, ChevronRight, ClipboardCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getOfferingsByAssistantAction } from "@/lib/actions/courses";
import { db } from "@/lib/db";
import { modules } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export default async function AssistantOfferingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.user.role !== "assistant" && session.user.role !== "super_admin") {
    redirect("/lms/courses");
  }

  const rows =
    session.user.role === "assistant"
      ? await getOfferingsByAssistantAction(session.user.id)
      : [];

  const offeringIds = rows.map((r) => r.offering.id);

  const moduleRows =
    offeringIds.length > 0
      ? await db
          .select({ id: modules.id, offeringId: modules.offeringId, orderIndex: modules.orderIndex })
          .from(modules)
          .where(inArray(modules.offeringId, offeringIds))
          .orderBy(asc(modules.orderIndex))
      : [];

  const firstModuleByOffering = new Map<string, string>();
  for (const m of moduleRows) {
    if (!firstModuleByOffering.has(m.offeringId)) {
      firstModuleByOffering.set(m.offeringId, m.id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Offerings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih offering untuk membuka halaman attendance per modul.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Belum ada offering yang ditugaskan ke akun ini.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ offering, course }) => {
            const firstModuleId = firstModuleByOffering.get(offering.id);
            const attendanceHref = firstModuleId
              ? `/lms/offerings/${offering.id}/modules/${firstModuleId}/attendance`
              : null;

            return (
              <div key={offering.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {course.name}
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {course.code}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {offering.semester} {offering.academicYear}
                  </p>
                  <p>
                    {offering.hari ?? "-"} {offering.shift ? `• ${offering.shift}` : ""}
                  </p>
                </div>

                <div className="mt-4">
                  {attendanceHref ? (
                    <Link
                      href={attendanceHref}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Open Attendance
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Belum ada modul untuk offering ini.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
