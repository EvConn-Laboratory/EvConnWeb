import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  enrollments,
  courseOfferings,
  courses,
  modules,
  moduleCompletions,
  assignments,
  submissions,
  grades,
  offeringAssistants,
  groups,
  users,
  feedbackEntries,
} from "@/lib/db/schema";
import { eq, and, inArray, isNull, sql, desc } from "drizzle-orm";
import StudentDashboard from "./StudentDashboard";
import AssistantDashboard from "./AssistantDashboard";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { role, name, sub } = session.user;

  // ─── Assistant / Super Admin ────────────────────────────────────────────

  if (role === "assistant" || role === "super_admin") {
    let offeringsData: {
      offeringId: string;
      courseName: string;
      courseCode: string;
      semester: string;
      hari: string | null;
      shift: string | null;
      status: "draft" | "active" | "closed" | "archived";
      isLead: boolean;
      studentCount: number;
      groupCount: number;
      pendingGrades: number;
    }[] = [];
    let pendingGradingCount = 0;
    let totalStudentsCount = 0;
    type GradingQueueItem = { studentName: string; assignment: string; module: string; submittedAt: string; type: "essay_pdf" | "mcq" };
    type FeedbackStatItem = { module: string; assistantAvg: number; sessionAvg: number; labAvg: number; responseCount: number };
    let gradingQueueItems: GradingQueueItem[] = [];
    let feedbackStatItems: FeedbackStatItem[] = [];
    let avgFeedbackRating: string | number = "—";

    try {
      const assistantOfferings = await db
        .select({
          offeringId: courseOfferings.id,
          semester: courseOfferings.semester,
          hari: courseOfferings.hari,
          shift: courseOfferings.shift,
          status: courseOfferings.status,
          courseName: courses.name,
          courseCode: courses.code,
          isLead: offeringAssistants.isLead,
        })
        .from(offeringAssistants)
        .innerJoin(
          courseOfferings,
          eq(offeringAssistants.offeringId, courseOfferings.id),
        )
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .where(eq(offeringAssistants.assistantId, sub));

      const assistantOfferingIds = assistantOfferings.map((o) => o.offeringId);

      const enrollmentCounts =
        assistantOfferingIds.length > 0
          ? await db
              .select({
                offeringId: enrollments.offeringId,
                count: sql<number>`cast(count(*) as integer)`,
              })
              .from(enrollments)
              .where(inArray(enrollments.offeringId, assistantOfferingIds))
              .groupBy(enrollments.offeringId)
          : [];

      const groupCounts =
        assistantOfferingIds.length > 0
          ? await db
              .select({
                offeringId: groups.offeringId,
                count: sql<number>`cast(count(*) as integer)`,
              })
              .from(groups)
              .where(inArray(groups.offeringId, assistantOfferingIds))
              .groupBy(groups.offeringId)
          : [];

      const enrollmentCountMap = new Map(
        enrollmentCounts.map((e) => [e.offeringId, e.count]),
      );
      const groupCountMap = new Map(
        groupCounts.map((g) => [g.offeringId, g.count]),
      );

      const pendingByOfferingRaw =
        assistantOfferingIds.length > 0
          ? await db
              .select({
                offeringId: modules.offeringId,
                count: sql<number>`cast(count(*) as integer)`,
              })
              .from(submissions)
              .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
              .innerJoin(modules, eq(assignments.moduleId, modules.id))
              .leftJoin(
                grades,
                and(
                  eq(grades.submissionId, submissions.id),
                  eq(grades.status, "published"),
                ),
              )
              .where(
                and(
                  inArray(modules.offeringId, assistantOfferingIds),
                  isNull(grades.id),
                ),
              )
              .groupBy(modules.offeringId)
          : [];

      const pendingByOfferingMap = new Map(
        pendingByOfferingRaw.map((p) => [p.offeringId, Number(p.count)]),
      );

      offeringsData = assistantOfferings.map((o) => ({
        offeringId: o.offeringId,
        courseName: o.courseName,
        courseCode: o.courseCode,
        semester: o.semester,
        hari: o.hari,
        shift: o.shift,
        status: o.status,
        isLead: o.isLead,
        studentCount: Number(enrollmentCountMap.get(o.offeringId) ?? 0),
        groupCount: Number(groupCountMap.get(o.offeringId) ?? 0),
        pendingGrades: Number(pendingByOfferingMap.get(o.offeringId) ?? 0),
      }));

      totalStudentsCount = offeringsData.reduce(
        (sum, o) => sum + o.studentCount,
        0,
      );

      // Pending = submitted with no published grade
      if (assistantOfferingIds.length > 0) {
        const [pendingResult] = await db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(submissions)
          .innerJoin(
            assignments,
            eq(submissions.assignmentId, assignments.id),
          )
          .innerJoin(modules, eq(assignments.moduleId, modules.id))
          .leftJoin(
            grades,
            and(
              eq(grades.submissionId, submissions.id),
              eq(grades.status, "published"),
            ),
          )
          .where(
            and(
              inArray(modules.offeringId, assistantOfferingIds),
              isNull(grades.id),
            ),
          );
        pendingGradingCount = Number(pendingResult?.count ?? 0);
      }

      // Get recent ungraded essay submissions (latest 5) for display
      const recentUngraded = assistantOfferingIds.length > 0 ? await db
        .select({
          submissionId: submissions.id,
          studentName: users.name,
          assignmentTitle: assignments.title,
          assignmentType: assignments.format,
          moduleTitle: modules.title,
          submittedAt: submissions.submittedAt,
        })
        .from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .innerJoin(modules, eq(assignments.moduleId, modules.id))
        .innerJoin(users, eq(submissions.studentId, users.id))
        .leftJoin(grades, and(eq(grades.submissionId, submissions.id), eq(grades.status, "published")))
        .where(and(
          inArray(modules.offeringId, assistantOfferingIds),
          isNull(grades.id),
          eq(assignments.format, "essay_pdf"),
        ))
        .orderBy(desc(submissions.submittedAt))
        .limit(5) : []

      const feedbackData = assistantOfferingIds.length > 0 ? await db
        .select({
          moduleId: modules.id,
          moduleTitle: modules.title,
          type: feedbackEntries.type,
          avgRating: sql<number>`round(avg(${feedbackEntries.rating})::numeric, 1)`,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(feedbackEntries)
        .innerJoin(modules, eq(feedbackEntries.moduleId, modules.id))
        .where(inArray(modules.offeringId, assistantOfferingIds))
        .groupBy(modules.id, modules.title, feedbackEntries.type)
        .orderBy(modules.orderIndex) : []

      gradingQueueItems = recentUngraded.map((r) => ({
        studentName: r.studentName,
        assignment: r.assignmentTitle,
        module: r.moduleTitle,
        submittedAt: r.submittedAt.toLocaleDateString("id-ID"),
        type: r.assignmentType as "essay_pdf" | "mcq",
      }))

      const feedbackByModule = new Map<string, { title: string; avgByType: Map<string, number>; count: number }>()
      for (const f of feedbackData) {
        const entry = feedbackByModule.get(f.moduleId) ?? { title: f.moduleTitle, avgByType: new Map(), count: 0 }
        entry.avgByType.set(f.type, Number(f.avgRating))
        entry.count = Math.max(entry.count, f.count)
        feedbackByModule.set(f.moduleId, entry)
      }
      feedbackStatItems = Array.from(feedbackByModule.values())
        .slice(0, 5)
        .map(f => ({
          module: f.title,
          assistantAvg: f.avgByType.get("assistant") ?? 0,
          sessionAvg: f.avgByType.get("session") ?? 0,
          labAvg: f.avgByType.get("laboratory") ?? 0,
          responseCount: f.count,
        }))

      const allRatings = feedbackData.map(f => Number(f.avgRating)).filter(n => n > 0)
      avgFeedbackRating = allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : "—"
    } catch (err) {
      console.error("[DashboardPage] Failed to fetch assistant data:", err);
    }

    return (
      <AssistantDashboard
        userName={name}
        role={role}
        offeringsCount={offeringsData.length}
        totalStudentsCount={totalStudentsCount}
        pendingGradingCount={pendingGradingCount}
        offerings={offeringsData}
        gradingQueue={gradingQueueItems}
        feedbackStats={feedbackStatItems}
        avgFeedbackRating={avgFeedbackRating}
      />
    );
  }

  // ─── Student / Guest ─────────────────────────────────────────────────────

  let coursesData: {
    id: string;
    name: string;
    code: string;
    hari: string | null;
    shift: string | null;
    semester: string;
    type: "praktikum" | "study_group";
    modulesTotal: number;
    modulesComplete: number;
  }[] = [];

  let recentModules: {
    id: string;
    title: string;
    orderIndex: number;
    isComplete: boolean;
    offeringId: string;
  }[] = [];

  let completedModulesCount = 0;
  let totalModulesCount = 0;
  let submittedAssignmentsCount = 0;
  let totalAssignmentsCount = 0;
  let gradedCount = 0;

  try {
    const studentEnrollments = await db
      .select({
        offeringId: courseOfferings.id,
        semester: courseOfferings.semester,
        hari: courseOfferings.hari,
        shift: courseOfferings.shift,
        courseName: courses.name,
        courseCode: courses.code,
        courseType: courses.type,
      })
      .from(enrollments)
      .innerJoin(
        courseOfferings,
        eq(enrollments.offeringId, courseOfferings.id),
      )
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .where(eq(enrollments.studentId, sub));

    const offeringIds = studentEnrollments.map((e) => e.offeringId);

    const allModules =
      offeringIds.length > 0
        ? await db
            .select({
              id: modules.id,
              offeringId: modules.offeringId,
              title: modules.title,
              orderIndex: modules.orderIndex,
            })
            .from(modules)
            .where(inArray(modules.offeringId, offeringIds))
        : [];

    const completions =
      offeringIds.length > 0
        ? await db
            .select({ moduleId: moduleCompletions.moduleId })
            .from(moduleCompletions)
            .where(eq(moduleCompletions.studentId, sub))
        : [];

    const completedModuleIds = new Set(completions.map((c) => c.moduleId));

    // Group modules by offering for per-course counts
    const modulesByOffering = new Map<string, typeof allModules>();
    for (const mod of allModules) {
      const list = modulesByOffering.get(mod.offeringId) ?? [];
      list.push(mod);
      modulesByOffering.set(mod.offeringId, list);
    }

    coursesData = studentEnrollments.map((e) => {
      const mods = modulesByOffering.get(e.offeringId) ?? [];
      const complete = mods.filter((m) => completedModuleIds.has(m.id)).length;
      return {
        id: e.offeringId,
        name: e.courseName,
        code: e.courseCode,
        hari: e.hari,
        shift: e.shift,
        semester: e.semester,
        type: e.courseType,
        modulesTotal: mods.length,
        modulesComplete: complete,
      };
    });

    recentModules = allModules
      .map((m) => ({
        id: m.id,
        title: m.title,
        orderIndex: m.orderIndex,
        isComplete: completedModuleIds.has(m.id),
        offeringId: m.offeringId,
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    completedModulesCount = recentModules.filter((m) => m.isComplete).length;
    totalModulesCount = recentModules.length;

    // Submissions
    const studentSubmissions = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(eq(submissions.studentId, sub));

    submittedAssignmentsCount = studentSubmissions.length;

    if (offeringIds.length > 0) {
      const [totalAssResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(assignments)
        .innerJoin(modules, eq(assignments.moduleId, modules.id))
        .where(
          and(
            inArray(modules.offeringId, offeringIds),
            eq(assignments.isPublished, true),
          ),
        );
      totalAssignmentsCount = Number(totalAssResult?.count ?? 0);
    }

    const submissionIds = studentSubmissions.map((s) => s.id);
    if (submissionIds.length > 0) {
      const [gradedResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(grades)
        .where(
          and(
            inArray(grades.submissionId, submissionIds),
            eq(grades.status, "published"),
          ),
        );
      gradedCount = Number(gradedResult?.count ?? 0);
    }
  } catch (err) {
    console.error("[DashboardPage] Failed to fetch student data:", err);
  }

  return (
    <StudentDashboard
      userName={name}
      courses={coursesData}
      completedModulesCount={completedModulesCount}
      totalModulesCount={totalModulesCount}
      submittedAssignmentsCount={submittedAssignmentsCount}
      totalAssignmentsCount={totalAssignmentsCount}
      gradedCount={gradedCount}
      recentModules={recentModules}
    />
  );
}
