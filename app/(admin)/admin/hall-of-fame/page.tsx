import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, Users, UserCheck, GraduationCap, Layers } from "lucide-react";
import { db } from "@/lib/db";
import { generations, assistantProfiles } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { asc, eq, sql } from "drizzle-orm";
import { AddGenerationForm } from "./generations/_components/AddGenerationForm";

export const metadata: Metadata = { title: "Hall of Fame | Admin" };

const TABS = [
  { label: "Overview", href: "/admin/hall-of-fame" },
  { label: "Generations", href: "/admin/hall-of-fame/generations" },
  { label: "Assistants", href: "/admin/hall-of-fame/assistants" },
  { label: "Roles", href: "/admin/hall-of-fame/roles" },
];

export default async function HallOfFamePage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  const allGenerations = await db
    .select()
    .from(generations)
    .orderBy(asc(generations.number));

  const memberCountsRaw = await db
    .select({
      generationId: assistantProfiles.generationId,
      count: sql<number>`count(*)`,
    })
    .from(assistantProfiles)
    .groupBy(assistantProfiles.generationId);

  const memberCountMap = new Map(
    memberCountsRaw.map((r) => [r.generationId, Number(r.count)]),
  );

  const totalMembersRes = await db.select({ count: sql<number>`count(*)` }).from(assistantProfiles);
  const activeMembersRes = await db.select({ count: sql<number>`count(*)` }).from(assistantProfiles).where(eq(assistantProfiles.status, "active"));
  const alumniMembersRes = await db.select({ count: sql<number>`count(*)` }).from(assistantProfiles).where(eq(assistantProfiles.status, "alumni"));

  const totalMembers = Number(totalMembersRes[0]?.count ?? 0);
  const activeMembers = Number(activeMembersRes[0]?.count ?? 0);
  const alumniMembers = Number(alumniMembersRes[0]?.count ?? 0);

  const stats = [
    { label: "Generations", value: allGenerations.length, Icon: Layers, accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { label: "Total Assistants", value: totalMembers, Icon: Users, accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "Active", value: activeMembers, Icon: UserCheck, accent: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { label: "Alumni", value: alumniMembers, Icon: GraduationCap, accent: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Hall of Fame</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage generations and assistant profiles
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab.href === "/admin/hall-of-fame"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", stat.accent)}>
              <stat.Icon className="h-4.5 w-4.5" size={18} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-foreground">{stat.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Generations</h2>
          <AddGenerationForm />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Gen</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Years</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Members</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allGenerations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No generations yet.
                  </td>
                </tr>
              ) : (
                allGenerations.map((gen) => (
                  <tr key={gen.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-foreground">G{gen.number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{gen.name}</p>
                      {gen.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{gen.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {gen.startYear}{gen.endYear ? ` – ${gen.endYear}` : " – present"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {(memberCountMap.get(gen.id) ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {gen.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Ended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button variant="outline" size="xs" asChild className="gap-1">
                          <Link href={`/admin/hall-of-fame/assistants?generationId=${gen.id}`}>
                            <Users className="h-3 w-3" />
                            Manage Assistants
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
