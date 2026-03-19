import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListOrdered } from "lucide-react";
import { db } from "@/lib/db";
import { organizationalRoles } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { asc } from "drizzle-orm";
import { AddRoleForm } from "./_components/AddRoleForm";
import { EditRoleForm } from "./_components/EditRoleForm";

export const metadata: Metadata = { title: "Roles | Hall of Fame | Admin" };

const TABS = [
  { label: "Overview", href: "/admin/hall-of-fame" },
  { label: "Generations", href: "/admin/hall-of-fame/generations" },
  { label: "Assistants", href: "/admin/hall-of-fame/assistants" },
  { label: "Roles", href: "/admin/hall-of-fame/roles" },
];

export default async function RolesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  const roles = await db
    .select()
    .from(organizationalRoles)
    .orderBy(asc(organizationalRoles.sortOrder));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ListOrdered className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Organizational Roles
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {roles.length === 0
              ? "No roles yet"
              : `${roles.length} role${roles.length !== 1 ? "s" : ""} defined`}
          </p>
        </div>

        <AddRoleForm />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab.href === "/admin/hall-of-fame/roles"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Order</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role Name</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No organizational roles yet.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{role.sortOrder}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{role.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {role.description ?? <span className="italic text-muted-foreground/60">No description</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <EditRoleForm role={role} />
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
