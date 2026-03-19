import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ArrowUpRight } from "lucide-react";
import {
  getAllCmsPagesAction,
  toggleCmsPagePublishedAction,
} from "@/lib/actions/cms";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddCmsPageForm, EditCmsPageForm } from "./_components/CmsPageCrud";

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
          <div className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground text-left">
              Pages
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground text-left">
            {pages.length === 0
              ? "No pages yet"
              : `${pages.length} pages · `}
            {pages.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {publishedCount} published
              </span>
            )}
          </p>
        </div>

        <AddCmsPageForm />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden text-left">
        <div className="overflow-x-auto text-left">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Slug
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Title
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Updated
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-left">
              {pages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No static pages yet.
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
                      <p className="font-medium text-foreground text-left">{page.title}</p>
                    </td>

                    {/* Published status */}
                    <td className="px-4 py-3">
                      {page.isPublished ? (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Updated at */}
                    <td className="px-4 py-3 font-semibold">
                      <span className="text-xs text-muted-foreground">
                        {new Date(page.updatedAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 text-left">
                        {page.isPublished && (
                          <Link
                            href={`/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                          >
                            View
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
                          <button
                            type="submit"
                            title={page.isPublished ? "Unpublish" : "Publish"}
                            className={cn(
                              "inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-2 py-1 gap-1",
                              page.isPublished
                                ? "text-muted-foreground"
                                : "text-green-600 border-green-500/30 hover:bg-green-500/10",
                            )}
                          >
                            {page.isPublished ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <EditCmsPageForm page={page} />
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
