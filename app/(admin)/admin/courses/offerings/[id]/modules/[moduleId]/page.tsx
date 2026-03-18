import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import {
  modules,
  courseOfferings,
  courses,
  contentItems,
  assignments,
  mcqQuestions,
  mcqOptions,
} from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { ModuleContentManager } from "./_components/ModuleContentManager";
import type { AssignmentWithQuestions } from "./_components/AssignmentsManager";

export const metadata: Metadata = { title: "Module Content | Admin" };

interface PageProps {
  params: Promise<{ id: string; moduleId: string }>;
}

export default async function ModuleManagePage({ params }: PageProps) {
  const { id: offeringId, moduleId } = await params;

  // 1. Fetch module with offering + course
  const [row] = await db
    .select({
      module: modules,
      offering: {
        id: courseOfferings.id,
        semester: courseOfferings.semester,
        academicYear: courseOfferings.academicYear,
      },
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
    })
    .from(modules)
    .innerJoin(courseOfferings, eq(modules.offeringId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!row || row.module.offeringId !== offeringId) notFound();

  const { module, offering, course } = row;

  // 2. Fetch content items
  const items = await db
    .select()
    .from(contentItems)
    .where(eq(contentItems.moduleId, moduleId))
    .orderBy(asc(contentItems.orderIndex));

  // 3. Fetch assignments
  const moduleAssignments = await db
    .select()
    .from(assignments)
    .where(eq(assignments.moduleId, moduleId))
    .orderBy(asc(assignments.orderIndex));

  // 4. For MCQ assignments, fetch questions + options
  const mcqAssignmentIds = moduleAssignments
    .filter((a) => a.format === "mcq")
    .map((a) => a.id);

  const questions =
    mcqAssignmentIds.length > 0
      ? await db
          .select()
          .from(mcqQuestions)
          .where(inArray(mcqQuestions.assignmentId, mcqAssignmentIds))
          .orderBy(asc(mcqQuestions.orderIndex))
      : [];

  const questionIds = questions.map((q) => q.id);

  const options =
    questionIds.length > 0
      ? await db
          .select()
          .from(mcqOptions)
          .where(inArray(mcqOptions.questionId, questionIds))
          .orderBy(asc(mcqOptions.orderIndex))
      : [];

  // 5. Compose assignments with nested questions + options
  const optionsByQuestion = new Map<string, typeof options>();
  for (const opt of options) {
    const arr = optionsByQuestion.get(opt.questionId) ?? [];
    arr.push(opt);
    optionsByQuestion.set(opt.questionId, arr);
  }

  const questionsByAssignment = new Map<string, typeof questions>();
  for (const q of questions) {
    const arr = questionsByAssignment.get(q.assignmentId) ?? [];
    arr.push(q);
    questionsByAssignment.set(q.assignmentId, arr);
  }

  const assignmentsWithQuestions: AssignmentWithQuestions[] = moduleAssignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type,
    format: a.format,
    maxScore: a.maxScore,
    deadline: a.deadline,
    allowResubmit: a.allowResubmit,
    isRequired: a.isRequired,
    isPublished: a.isPublished,
    orderIndex: a.orderIndex,
    questions:
      a.format === "mcq"
        ? (questionsByAssignment.get(a.id) ?? []).map((q) => ({
            id: q.id,
            questionText: q.questionText,
            orderIndex: q.orderIndex,
            points: Number(q.points),
            options: (optionsByQuestion.get(q.id) ?? []).map((o) => ({
              id: o.id,
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              orderIndex: o.orderIndex,
            })),
          }))
        : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Link
          href="/admin/courses"
          className="hover:text-foreground transition-colors"
        >
          Courses
        </Link>
        <span>/</span>
        <Link
          href={`/admin/courses/${course.id}/edit`}
          className="hover:text-foreground transition-colors"
        >
          {course.name}
        </Link>
        <span>/</span>
        <Link
          href={`/admin/courses/offerings/${offeringId}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {offering.semester} {offering.academicYear}
        </Link>
        <span>/</span>
        <span className="text-foreground">{module.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {module.title}
          </h1>
          {module.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {module.description}
            </p>
          )}
        </div>
      </div>

      {/* Content + Assignment manager */}
      <ModuleContentManager
        module={{
          id: module.id,
          offeringId: module.offeringId,
          title: module.title,
          description: module.description,
          orderIndex: module.orderIndex,
          status: module.status,
          openDatetime: module.openDatetime,
          closeDatetime: module.closeDatetime,
          manualOverride: module.manualOverride,
        }}
        contentItems={items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          contentData: item.contentData,
          orderIndex: item.orderIndex,
          isPublished: item.isPublished,
        }))}
        assignments={assignmentsWithQuestions}
        offeringId={offeringId}
      />
    </div>
  );
}
