import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getAllProgramsAction, toggleProgramPublishedAction } from "@/lib/actions/cms";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddProgramForm } from "./_components/AddProgramForm";

export const metadata: Metadata = { title: "Programs | CMS | Admin" };

async function handleToggleProgram(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const isPublished = formData.get("isPublished") === "true";
  if (!id) return;
  await toggleProgramPublishedAction(id, !isPublished);
}

export default async function AdminCmsProgramsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  const programs = await getAllProgramsAction();
  const publishedCount = programs.filter((p) => p.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Programs</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {programs.length === 0
              ? "No programs yet"
              : `${programs.length} program${programs.length !== 1 ? "s" : ""} · `}
            {programs.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {publishedCount} published
              </span>
            )}
          </p>
        </div>

        <AddProgramForm />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Order</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No programs yet. Add the first one above.
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{program.sortOrder}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{program.title}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {program.description ?? <span className="italic text-muted-foreground/60">No description</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {program.isPublished ? (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <form action={handleToggleProgram}>
                          <input type="hidden" name="id" value={program.id} />
                          <input type="hidden" name="isPublished" value={String(program.isPublished)} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="xs"
                            className={cn(
                              "gap-1",
                              program.isPublished
                                ? "text-muted-foreground"
                                : "text-green-600 border-green-500/30 hover:bg-green-500/10",
                            )}
                          >
                            {program.isPublished ? "Unpublish" : "Publish"}
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
      </div>
    </div>
  );
}
