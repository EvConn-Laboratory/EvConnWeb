import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Users, BookOpen, ChevronRight, UsersRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  groups,
  courseOfferings,
  courses,
  enrollments,
  offeringAssistants,
  users,
  modules,
} from "@/lib/db/schema";
import { eq, sql, inArray, asc } from "drizzle-orm";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Groups",
};

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (
    session.user.role !== "assistant" &&
    session.user.role !== "super_admin"
  ) {
    redirect("/lms/courses");
  }

  // ── Fetch offerings for this user ──────────────────────────────────────────

  type OfferingRow = {
    offeringId: string;
    semester: string;
    academicYear: string;
    hari: string | null;
    shift: string | null;
    courseName: string;
    courseCode: string;
  };

  const offeringRows: OfferingRow[] =
    session.user.role === "assistant"
      ? await db
          .select({
            offeringId: offeringAssistants.offeringId,
            semester: courseOfferings.semester,
            academicYear: courseOfferings.academicYear,
            hari: courseOfferings.hari,
            shift: courseOfferings.shift,
            courseName: courses.name,
            courseCode: courses.code,
          })
          .from(offeringAssistants)
          .innerJoin(
            courseOfferings,
            eq(courseOfferings.id, offeringAssistants.offeringId),
          )
          .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
          .where(eq(offeringAssistants.assistantId, session.user.id))
      : await db
          .select({
            offeringId: courseOfferings.id,
            semester: courseOfferings.semester,
            academicYear: courseOfferings.academicYear,
            hari: courseOfferings.hari,
            shift: courseOfferings.shift,
            courseName: courses.name,
            courseCode: courses.code,
          })
          .from(courseOfferings)
          .innerJoin(courses, eq(courses.id, courseOfferings.courseId));

  const myOfferingIds = offeringRows.map((r) => r.offeringId);

  // ── Fetch groups with member counts ────────────────────────────────────────

  const allGroups =
    myOfferingIds.length > 0
      ? await db
          .select({
            id: groups.id,
            number: groups.number,
            name: groups.name,
            offeringId: groups.offeringId,
            memberCount:
              sql<number>`count(distinct ${enrollments.studentId})`.as(
                "member_count",
              ),
          })
          .from(groups)
          .leftJoin(enrollments, eq(enrollments.groupId, groups.id))
          .where(inArray(groups.offeringId, myOfferingIds))
          .groupBy(groups.id)
          .orderBy(asc(groups.number))
      : [];

  // ── Fetch first module per offering (for attendance link) ─────────────────

  const moduleRows =
    myOfferingIds.length > 0
      ? await db
          .select({
            id: modules.id,
            offeringId: modules.offeringId,
          })
          .from(modules)
          .where(inArray(modules.offeringId, myOfferingIds))
          .orderBy(asc(modules.orderIndex))
      : [];

  const firstModuleByOffering = new Map<string, string>();
  for (const m of moduleRows) {
    if (!firstModuleByOffering.has(m.offeringId)) {
      firstModuleByOffering.set(m.offeringId, m.id);
    }
  }

  // ── Fetch up to 3 member names per group ──────────────────────────────────

  const groupIds = allGroups.map((g) => g.id);

  const memberRows =
    groupIds.length > 0
      ? await db
          .select({
            groupId: enrollments.groupId,
            studentName: users.name,
          })
          .from(enrollments)
          .innerJoin(users, eq(users.id, enrollments.studentId))
          .where(inArray(enrollments.groupId, groupIds))
          .orderBy(asc(users.name))
      : [];

  const membersByGroup = new Map<string, string[]>();
  for (const row of memberRows) {
    if (!row.groupId) continue;
    const list = membersByGroup.get(row.groupId) ?? [];
    if (list.length < 3) {
      list.push(row.studentName);
      membersByGroup.set(row.groupId, list);
    }
  }

  // ── Organize groups by offering ───────────────────────────────────────────

  const offeringMeta = new Map(
    offeringRows.map((r) => [r.offeringId, r]),
  );

  const groupsByOffering = new Map<string, typeof allGroups>();
  for (const group of allGroups) {
    const list = groupsByOffering.get(group.offeringId) ?? [];
    list.push(group);
    groupsByOffering.set(group.offeringId, list);
  }

  const totalGroups = allGroups.length;
  const totalMembers = allGroups.reduce(
    (sum, g) => sum + Number(g.memberCount),
    0,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Groups
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola grup praktikum dari offering yang Anda ampu.
        </p>
      </div>

      {/* Empty state — no offerings */}
      {myOfferingIds.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Belum ada offering
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Anda belum ditugaskan ke offering manapun. Hubungi administrator
            untuk mendapatkan akses.
          </p>
          <Link
            href="/lms/offerings"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            Lihat Offerings
          </Link>
        </div>
      )}

      {/* Has offerings */}
      {myOfferingIds.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Total Offering",
                value: myOfferingIds.length,
                accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                icon: BookOpen,
              },
              {
                label: "Total Grup",
                value: totalGroups,
                accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                icon: UsersRound,
              },
              {
                label: "Total Mahasiswa",
                value: totalMembers,
                accent: "bg-green-500/10 text-green-600 dark:text-green-400",
                icon: Users,
              },
            ].map(({ label, value, accent, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    accent,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state — offerings exist but no groups yet */}
          {allGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <UsersRound className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Belum ada grup
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Grup belum dibuat untuk offering yang Anda ampu.
              </p>
            </div>
          )}

          {/* Groups organized by offering */}
          {allGroups.length > 0 && (
            <div className="space-y-8">
              {Array.from(groupsByOffering.entries()).map(
                ([offeringId, offeringGroups]) => {
                  const meta = offeringMeta.get(offeringId);
                  if (!meta) return null;

                  const firstModuleId = firstModuleByOffering.get(offeringId);
                  const attendanceHref = firstModuleId
                    ? `/lms/offerings/${offeringId}/modules/${firstModuleId}/attendance`
                    : `/lms/offerings`;

                  return (
                    <section key={offeringId} className="space-y-3">
                      {/* Offering section header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <h2 className="text-sm font-semibold text-foreground">
                              {meta.courseName}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {meta.courseCode} &bull; {meta.semester}{" "}
                              {meta.academicYear}
                              {meta.hari ? ` · ${meta.hari}` : ""}
                              {meta.shift ? ` · ${meta.shift}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {offeringGroups.length} grup
                        </span>
                      </div>

                      {/* Group cards */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {offeringGroups.map((group) => {
                          const members = membersByGroup.get(group.id) ?? [];
                          const memberCount = Number(group.memberCount);

                          return (
                            <div
                              key={group.id}
                              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
                            >
                              {/* Group identity */}
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
                                  {group.number}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-semibold text-foreground">
                                    {group.name ?? `Kelompok ${group.number}`}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {memberCount} anggota
                                  </p>
                                </div>
                              </div>

                              {/* Member preview */}
                              {members.length > 0 ? (
                                <div className="space-y-1.5">
                                  {members.map((name) => (
                                    <div
                                      key={name}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-foreground">
                                        {name.charAt(0)}
                                      </div>
                                      <span className="truncate text-xs text-muted-foreground">
                                        {name}
                                      </span>
                                    </div>
                                  ))}
                                  {memberCount > 3 && (
                                    <p className="pl-7 text-[11px] text-muted-foreground">
                                      +{memberCount - 3} anggota lainnya
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Belum ada anggota
                                </p>
                              )}

                              {/* Action */}
                              <Link
                                href={attendanceHref}
                                className="mt-auto inline-flex items-center gap-1 self-start rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                              >
                                Lihat Detail
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                },
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
