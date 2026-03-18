import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Plus, ArrowUpRight } from "lucide-react";
import {
  getAllCmsPagesAction,
  toggleCmsPagePublishedAction,
} from "@/lib/actions/cms";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pages | CMS | Admin" };

// ─── Toggle action ────────────────────────────────────────────────────────────

async function handleTogglePage(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const isPublished = formData.get("isPublished") === "true";
  if (!id) return;
  await toggleCmsPagePublishedAction(id, !isPublished);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCmsPagesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  const pages = await getAllCmsPagesAction();

  const publishedCount = pages.filter((p) => p.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Pages
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {pages.length === 0
              ? "Belum ada halaman"
              : `${pages.length} halaman · `}
            {pages.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {publishedCount} diterbitkan
              </span>
            )}
          </p>
        </div>

        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-3.5 w-3.5" />
          Tambah Halaman
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Slug
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Judul
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Diperbarui
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    Belum ada halaman statis.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr
                    key={page.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Slug */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        /{page.slug}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{page.title}</p>
                    </td>

                    {/* Published status */}
                    <td className="px-4 py-3">
                      {page.isPublished ? (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                          Diterbitkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Updated at */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(page.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {page.isPublished && (
                          <Link
                            href={`/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                          >
                            Lihat
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                        <form action={handleTogglePage}>
                          <input type="hidden" name="id" value={page.id} />
                          <input
                            type="hidden"
                            name="isPublished"
                            value={String(page.isPublished)}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="xs"
                            className={cn(
                              "gap-1",
                              page.isPublished
                                ? "text-muted-foreground"
                                : "text-green-600 border-green-500/30 hover:bg-green-500/10",
                            )}
                          >
                            {page.isPublished ? "Cabut" : "Terbitkan"}
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
