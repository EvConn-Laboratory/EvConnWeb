import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  BookOpen,
  Trophy,
  FileText,
  Award,
  BarChart2,
  FileUp,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  users,
  courses,
  courseOfferings,
  generations,
  assistantProfiles,
  newsArticles,
  certificates,
} from "@/lib/db/schema";
import { eq, count, desc, isNull } from "drizzle-orm";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function getStats() {
  const [[totalUsers], [totalCourses], [totalOfferings], [totalGens], [totalAssistants], [publishedNews], [totalCerts]] =
    await Promise.all([
      db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
      db.select({ value: count() }).from(courses).where(eq(courses.isActive, true)),
      db.select({ value: count() }).from(courseOfferings),
      db.select({ value: count() }).from(generations),
      db.select({ value: count() }).from(assistantProfiles),
      db.select({ value: count() }).from(newsArticles).where(eq(newsArticles.status, "published")),
      db.select({ value: count() }).from(certificates),
    ]);

  return {
    users: Number(totalUsers?.value ?? 0),
    courses: Number(totalCourses?.value ?? 0),
    offerings: Number(totalOfferings?.value ?? 0),
    generations: Number(totalGens?.value ?? 0),
    assistants: Number(totalAssistants?.value ?? 0),
    news: Number(publishedNews?.value ?? 0),
    certificates: Number(totalCerts?.value ?? 0),
  };
}

async function getRecentUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))
    .limit(5);
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/lms/dashboard");

  const [stats, recentUsers] = await Promise.all([getStats(), getRecentUsers()]);

  const STAT_CARDS = [
    {
      icon: Users,
      value: stats.users,
      label: "Total Users",
      href: "/admin/users",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: BookOpen,
      value: stats.courses,
      label: "Courses",
      href: "/admin/courses",
      color: "bg-blue-500/10 text-blue-400",
    },
    {
      icon: BarChart2,
      value: stats.offerings,
      label: "Course Offerings",
      href: "/admin/courses",
      color: "bg-violet-500/10 text-violet-400",
    },
    {
      icon: Trophy,
      value: stats.generations,
      label: "Generations",
      href: "/admin/hall-of-fame",
      color: "bg-amber-500/10 text-amber-400",
    },
    {
      icon: Users,
      value: stats.assistants,
      label: "Assistants",
      href: "/admin/hall-of-fame/assistants",
      color: "bg-green-500/10 text-green-400",
    },
    {
      icon: FileText,
      value: stats.news,
      label: "Published News",
      href: "/admin/cms/news",
      color: "bg-pink-500/10 text-pink-400",
    },
    {
      icon: Award,
      value: stats.certificates,
      label: "Certificates",
      href: "/admin/certificates",
      color: "bg-amber-500/10 text-amber-400",
    },
  ];

  const QUICK_ACTIONS = [
    { href: "/admin/users", icon: Users, label: "Manage Users" },
    { href: "/admin/courses", icon: BookOpen, label: "Manage Courses" },
    { href: "/admin/hall-of-fame", icon: Trophy, label: "Hall of Fame" },
    { href: "/admin/cms", icon: FileText, label: "Manage CMS" },
    { href: "/admin/certificates", icon: Award, label: "Certificates" },
    { href: "/admin/import", icon: FileUp, label: "Import CSV" },
  ];

  const ROLE_COLOR: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-400",
    assistant: "bg-blue-500/10 text-blue-400",
    student: "bg-green-500/10 text-green-400",
    guest: "bg-muted text-muted-foreground",
  };
  const ROLE_LABEL: Record<string, string> = {
    super_admin: "Super Admin",
    assistant: "Assistant",
    student: "Student",
    guest: "Guest",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          EvConn Laboratory platform overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Users
            </h2>
            <Link
              href="/admin/users"
              className="text-xs font-medium text-primary hover:underline"
            >
              All →
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No users yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}/edit`}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {u.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{u.username}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role] ?? ROLE_COLOR.guest}`}
                  >
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.label}
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>

          {/* System info */}
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              System Status
            </p>
            <div className="space-y-2">
              {[
                { label: "Platform", value: "EvConn Laboratory" },
                { label: "Version", value: "1.0.0" },
                {
                  label: "Status",
                  value: "Operational",
                  badge: "bg-green-500/10 text-green-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.badge}`}
                    >
                      {item.value}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-foreground">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
