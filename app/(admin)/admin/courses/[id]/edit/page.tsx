import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { courses, courseOfferings, enrollments } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { CourseOfferingsManager } from "./_components/CourseOfferingsManager";

export const metadata: Metadata = { title: "Manage Offerings | Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseOfferingsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  const { id } = await params;

  // Fetch the course
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);

  if (!course) notFound();

  // Fetch all offerings for this course
  const offerings = await db
    .select()
    .from(courseOfferings)
    .where(eq(courseOfferings.courseId, id))
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

  const offeringsWithCount = offerings.map((o) => ({
    ...o,
    enrollmentCount: enrollmentCountMap.get(o.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Layers className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Manage Offerings
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{course.code}</span> — {course.name}
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/admin/courses">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <CourseOfferingsManager
        course={course}
        offerings={offeringsWithCount}
      />
    </div>
  );
}
