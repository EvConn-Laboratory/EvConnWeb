import { redirect } from "next/navigation";
import { MessageSquare, Star } from "lucide-react";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { feedbackEntries, modules, courseOfferings, courses } from "@/lib/db/schema";

const FEEDBACK_LABEL: Record<string, string> = {
  assistant: "Assistant",
  session: "Session",
  laboratory: "Laboratory",
};

export default async function FeedbackPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.user.role !== "student" && session.user.role !== "guest") {
    redirect("/lms/dashboard");
  }

  const rows = await db
    .select({
      id: feedbackEntries.id,
      type: feedbackEntries.type,
      rating: feedbackEntries.rating,
      comment: feedbackEntries.comment,
      createdAt: feedbackEntries.createdAt,
      moduleTitle: modules.title,
      semester: courseOfferings.semester,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(feedbackEntries)
    .innerJoin(modules, eq(feedbackEntries.moduleId, modules.id))
    .innerJoin(courseOfferings, eq(feedbackEntries.offeringId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(feedbackEntries.studentId, session.user.id))
    .orderBy(desc(feedbackEntries.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          History of feedback you have submitted per module.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          No feedback submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {row.courseName} ({row.courseCode})
                </p>
                <span className="text-xs text-muted-foreground">{row.semester}</span>
              </div>

              <p className="text-sm text-muted-foreground">{row.moduleTitle}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  <MessageSquare className="mr-1 h-3.5 w-3.5" />
                  {FEEDBACK_LABEL[row.type] ?? row.type}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  <Star className="mr-1 h-3.5 w-3.5" />
                  {row.rating}/5
                </span>
                <span className="text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {row.comment ? (
                <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">{row.comment}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
