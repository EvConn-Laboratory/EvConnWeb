import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, UserCog } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getUserByIdAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { EditUserForm } from "./_components/EditUserForm";

export const metadata: Metadata = { title: "Edit User | Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  const { id } = await params;
  const user = await getUserByIdAction(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserCog className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Edit User
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.name} @{user.username}
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/admin/users">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke User
          </Link>
        </Button>
      </div>

      <EditUserForm user={user} />
    </div>
  );
}