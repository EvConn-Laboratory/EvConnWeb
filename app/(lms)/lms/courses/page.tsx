import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getActiveOfferingsForStudentAction } from "@/lib/actions/courses";
import { db } from "@/lib/db";
import { modules, moduleCompletions } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import CourseGrid from "./CourseGrid";

export const metadata = { title: "My Courses" };

export default async function CoursesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const offerings = await getActiveOfferingsForStudentAction(session.user.id);

  // Enrich each offering with module progress counts
  const enriched = await Promise.all(
    offerings.map(async ({ offering, course }) => {
      const [{ total }] = await db
        .select({ total: count() })
        .from(modules)
        .where(eq(modules.offeringId, offering.id));

      const [{ completed }] = await db
        .select({ completed: count() })
        .from(moduleCompletions)
        .innerJoin(modules, eq(moduleCompletions.moduleId, modules.id))
        .where(
          and(
            eq(modules.offeringId, offering.id),
            eq(moduleCompletions.studentId, session.user.id),
            eq(moduleCompletions.isComplete, true),
          ),
        );

      return {
        offering,
        course,
        modulesTotal: total,
        modulesComplete: completed,
      };
    }),
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Courses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          List of courses you are currently taking this semester.
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No active courses yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Contact an assistant or admin to enroll you in a course.
          </p>
        </div>
      ) : (
        <CourseGrid offerings={enriched} />
      )}
    </div>
  );
}
