import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Newspaper, Plus, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { newsArticles, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import { DeleteNewsButton } from "./_components/DeleteNewsButton";

export const metadata: Metadata = { title: "News | CMS | Admin" };

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      Draft
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCmsNewsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  // Fetch articles with author name via join
  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      status: newsArticles.status,
      publishedAt: newsArticles.publishedAt,
      updatedAt: newsArticles.updatedAt,
      authorName: users.name,
    })
    .from(newsArticles)
    .innerJoin(users, eq(newsArticles.authorId, users.id))
    .orderBy(desc(newsArticles.updatedAt));

  const publishedCount = articles.filter((a) => a.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Newspaper className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground text-left">
              News
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground text-left">
            {articles.length === 0
              ? "No articles yet"
              : `${articles.length} articles · `}
            {articles.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {publishedCount} published
              </span>
            )}
          </p>
        </div>

        <Button size="sm" className="gap-1.5" asChild>
          <Link href="/admin/cms/news/create">
            <Plus className="h-3.5 w-3.5" />
            Create Article
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Title
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Slug
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Author
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Date
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {articles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No articles yet. Create your first article.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr
                    key={article.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-foreground line-clamp-2">
                        {article.title}
                      </p>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {article.slug}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={article.status} />
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {article.authorName}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 font-semibold">
                      <span className="text-xs text-muted-foreground">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString(
                              "en-US",
                              { day: "numeric", month: "short", year: "numeric" },
                            )
                          : new Date(article.updatedAt).toLocaleDateString(
                              "en-US",
                              { day: "numeric", month: "short", year: "numeric" },
                            )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {article.status === "published" && (
                          <Link
                            href={`/news/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                          >
                            View
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="xs"
                          asChild
                          className="gap-1 font-semibold"
                        >
                          <Link href={`/admin/cms/news/${article.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteNewsButton id={article.id} title={article.title} />
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
