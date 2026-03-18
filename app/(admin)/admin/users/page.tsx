import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Users,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  UserRound,
  Ghost,
} from "lucide-react";
import { getUsersAction, softDeleteUserAction } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserFilters } from "./_components/UserFilters";
import { AddUserForm } from "./_components/AddUserForm";

export const metadata: Metadata = { title: "User Management | Admin" };

const ROLE_CONFIG: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  super_admin: {
    label: "Super Admin",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    Icon: ShieldCheck,
  },
  assistant: {
    label: "Assistant",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Icon: UserRound,
  },
  student: {
    label: "Student",
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    Icon: GraduationCap,
  },
  guest: {
    label: "Guest",
    className: "bg-muted text-muted-foreground border-border",
    Icon: Ghost,
  },
};

async function handleDelete(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  if (!userId) return;
  await softDeleteUserAction(userId);
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.guest;
  const Icon = config.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

function PaginationBar({
  page,
  totalPages,
  q,
  role,
}: {
  page: number;
  totalPages: number;
  q?: string;
  role?: string;
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-1 pt-4">
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link href={buildHref(page - 1)} aria-disabled={page <= 1}>
          <Button variant="outline" size="sm" disabled={page <= 1} className="gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
        </Link>
        <Link href={buildHref(page + 1)} aria-disabled={page >= totalPages}>
          <Button variant="outline" size="sm" disabled={page >= totalPages} className="gap-1">
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q ?? "";
  const role = params.role ?? "";

  const { users, total, totalPages } = await getUsersAction({ page, search: q, role });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              User Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {total === 0 ? "No users yet" : `${total.toLocaleString()} user${total !== 1 ? "s" : ""} registered`}
          </p>
        </div>

        <AddUserForm />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Suspense>
          <UserFilters currentSearch={q} currentRole={role} />
        </Suspense>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">NIM</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {q || role ? "No users match the current filters." : "No users yet."}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground">
                        {user.nim ?? <span className="text-muted-foreground">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{user.email ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      {user.mustChangePassword ? (
                        <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
                          Change Password
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="xs" asChild className="gap-1">
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                        <form action={handleDelete}>
                          <input type="hidden" name="userId" value={user.id} />
                          <Button type="submit" variant="destructive" size="xs" className="gap-1">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <PaginationBar page={page} totalPages={totalPages} q={q} role={role} />
          </div>
        )}
      </div>
    </div>
  );
}
