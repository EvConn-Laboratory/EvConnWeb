import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  enrollments,
  courseOfferings,
  generations,
  assistantProfiles,
} from "@/lib/db/schema";
import { getPublishedProgramsAction, getPublishedNewsAction } from "@/lib/actions/cms";
import { getHallOfFameAction } from "@/lib/actions/personnel";
import LandingPageClient from "./LandingPageClient";

export default async function LandingPage() {
  const [enrolledStudentsRes, activeOfferingsRes, generationsRes, assistantsRes, rawPrograms, rawNews, hallOfFame] =
    await Promise.all([
      db
        .select({
          count: sql<number>`cast(count(distinct ${enrollments.studentId}) as integer)`,
        })
        .from(enrollments),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(courseOfferings)
        .where(sql`${courseOfferings.status} = 'active'`),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(generations),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(assistantProfiles)
        .where(sql`${assistantProfiles.status} = 'active'`),
      getPublishedProgramsAction(),
      getPublishedNewsAction(3),
      getHallOfFameAction(),
    ]);

  const enrolledStudents = Number(enrolledStudentsRes[0]?.count ?? 0);
  const activeOfferings = Number(activeOfferingsRes[0]?.count ?? 0);
  const generationsCount = Number(generationsRes[0]?.count ?? 0);
  const activeAssistants = Number(assistantsRes[0]?.count ?? 0);

  const stats = [
    {
      value: enrolledStudents.toLocaleString("id-ID"),
      label: "Students Enrolled",
      icon: "GraduationCap" as const,
    },
    {
      value: activeOfferings.toLocaleString("id-ID"),
      label: "Active Courses",
      icon: "BookOpen" as const,
    },
    {
      value: generationsCount.toLocaleString("id-ID"),
      label: "Generations",
      icon: "Trophy" as const,
    },
    {
      value: activeAssistants.toLocaleString("id-ID"),
      label: "Assistants",
      icon: "Users" as const,
    },
  ];

  const programs = rawPrograms.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    thumbnailPath: p.thumbnailPath,
  }));

  const news = rawNews.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.content
      ? a.content.replace(/<[^>]+>/g, "").slice(0, 130).trimEnd() + "…"
      : "",
    date: (a.publishedAt ?? a.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  }));

  return <LandingPageClient stats={stats} programs={programs} news={news} hallOfFame={hallOfFame} />;
}
