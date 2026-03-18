import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Github, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { assistantProfiles, generations, organizationalRoles, assistantRoles } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { asc, eq } from "drizzle-orm";
import { AddAssistantForm } from "./_components/AddAssistantForm";
import { EditAssistantForm } from "./_components/EditAssistantForm";

export const metadata: Metadata = { title: "Assistants | Hall of Fame | Admin" };

const TABS = [
  { label: "Overview", href: "/admin/hall-of-fame" },
  { label: "Generations", href: "/admin/hall-of-fame/generations" },
  { label: "Assistants", href: "/admin/hall-of-fame/assistants" },
  { label: "Roles", href: "/admin/hall-of-fame/roles" },
];

function Avatar({ name, photoPath }: { name: string; photoPath: string | null }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const COLORS = ["bg-blue-500","bg-green-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-teal-500","bg-indigo-500","bg-pink-500"];
  const color = COLORS[Math.abs(hash) % COLORS.length];

  if (photoPath) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoPath} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white", color)}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "alumni" }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      Alumni
    </span>
  );
}

interface PageProps {
  searchParams: Promise<{ generationId?: string }>;
}

export default async function AssistantsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  const params = await searchParams;
  const generationId = params.generationId;

  const [allGenerations, rows, allOrgRoles, allRoleAssignments] = await Promise.all([
    db.select().from(generations).orderBy(asc(generations.number)),
    db
      .select({
        id: assistantProfiles.id,
        fullName: assistantProfiles.fullName,
        status: assistantProfiles.status,
        generationId: assistantProfiles.generationId,
        profilePhotoPath: assistantProfiles.profilePhotoPath,
        githubUrl: assistantProfiles.githubUrl,
        instagramUrl: assistantProfiles.instagramUrl,
        linkedinUrl: assistantProfiles.linkedinUrl,
        joinedYear: assistantProfiles.joinedYear,
        endYear: assistantProfiles.endYear,
        generationName: generations.name,
        generationNumber: generations.number,
      })
      .from(assistantProfiles)
      .innerJoin(generations, eq(assistantProfiles.generationId, generations.id))
      .where(generationId ? eq(assistantProfiles.generationId, generationId) : undefined)
      .orderBy(asc(generations.number), asc(assistantProfiles.sortOrder)),
    db.select().from(organizationalRoles).orderBy(asc(organizationalRoles.sortOrder)),
    db
      .select({
        assistantId: assistantRoles.assistantId,
        roleId: assistantRoles.roleId,
        roleName: organizationalRoles.name,
        roleSortOrder: organizationalRoles.sortOrder,
      })
      .from(assistantRoles)
      .innerJoin(organizationalRoles, eq(assistantRoles.roleId, organizationalRoles.id)),
  ]);

  // Build roles map per assistant
  const rolesByAssistant = new Map<string, Array<{ roleId: string; roleName: string; sortOrder: number }>>();
  for (const r of allRoleAssignments) {
    const existing = rolesByAssistant.get(r.assistantId) ?? [];
    existing.push({ roleId: r.roleId, roleName: r.roleName, sortOrder: r.roleSortOrder });
    rolesByAssistant.set(r.assistantId, existing);
  }

  const rowsWithRoles = rows.map((row) => ({
    ...row,
    roles: (rolesByAssistant.get(row.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  const currentGeneration = generationId
    ? allGenerations.find((g) => g.id === generationId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {currentGeneration
                ? `Assistants — G${currentGeneration.number} ${currentGeneration.name}`
                : "All Assistants"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0
              ? "No assistants yet"
              : `${rows.length.toLocaleString()} assistant${rows.length !== 1 ? "s" : ""}`}
            {currentGeneration && (
              <>
                {" · "}
                <Link href="/admin/hall-of-fame/assistants" className="text-primary hover:underline underline-offset-4">
                  View all
                </Link>
              </>
            )}
          </p>
        </div>

        <AddAssistantForm generations={allGenerations.map((g) => ({ id: g.id, number: g.number, name: g.name }))} />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab.href === "/admin/hall-of-fame/assistants"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {allGenerations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/hall-of-fame/assistants"
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !generationId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </Link>
          {allGenerations.map((gen) => (
            <Link
              key={gen.id}
              href={`/admin/hall-of-fame/assistants?generationId=${gen.id}`}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                generationId === gen.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              G{gen.number}
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Assistant</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Generation</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Roles</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Social</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rowsWithRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No assistants yet.
                  </td>
                </tr>
              ) : (
                rowsWithRoles.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.fullName} photoPath={row.profilePhotoPath} />
                        <div>
                          <p className="font-medium text-foreground">{row.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.joinedYear}{row.endYear ? ` – ${row.endYear}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-foreground">G{row.generationNumber}</span>
                      <p className="text-xs text-muted-foreground">{row.generationName}</p>
                    </td>
                    <td className="px-4 py-3">
                      {row.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground/60 italic">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.roles.map((r) => (
                            <span
                              key={r.roleId}
                              className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400"
                            >
                              {r.roleName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.githubUrl && (
                          <a href={row.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
                            <Github className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {row.instagramUrl && (
                          <a href={row.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {row.linkedinUrl && (
                          <a href={row.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {!row.githubUrl && !row.instagramUrl && !row.linkedinUrl && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end">
                        <EditAssistantForm
                          assistant={{
                            id: row.id,
                            fullName: row.fullName,
                            generationId: row.generationId,
                            joinedYear: row.joinedYear,
                            endYear: row.endYear,
                            status: row.status,
                            githubUrl: row.githubUrl,
                            instagramUrl: row.instagramUrl,
                            linkedinUrl: row.linkedinUrl,
                          }}
                          generations={allGenerations.map((g) => ({ id: g.id, number: g.number, name: g.name }))}
                          currentRoles={row.roles}
                          availableRoles={allOrgRoles.map((r) => ({ id: r.id, name: r.name, sortOrder: r.sortOrder }))}
                        />
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
