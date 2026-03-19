import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Newspaper,
  Image,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { programs, newsArticles, galleryItems, cmsPages } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";

export const metadata: Metadata = { title: "CMS | Admin" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CmsOverviewPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  // Fetch published counts for each section
  const [
    programsRes,
    newsRes,
    galleryRes,
    pagesRes,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(programs)
      .where(eq(programs.isPublished, true)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(newsArticles)
      .where(eq(newsArticles.status, "published")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(galleryItems)
      .where(eq(galleryItems.isPublished, true)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(cmsPages)
      .where(eq(cmsPages.isPublished, true)),
  ]);

  const publishedProgramCount = Number(programsRes[0]?.count ?? 0);
  const publishedNewsCount = Number(newsRes[0]?.count ?? 0);
  const publishedGalleryCount = Number(galleryRes[0]?.count ?? 0);
  const publishedPageCount = Number(pagesRes[0]?.count ?? 0);

  const CARDS = [
    {
      label: "Programs",
      description: "Manage lab programs and services shown to the public.",
      href: "/admin/cms/programs",
      Icon: BookOpen,
      count: publishedProgramCount,
      countLabel: "published programs",
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      border: "border-violet-500/20",
    },
    {
      label: "News",
      description: "News articles and announcements from the lab.",
      href: "/admin/cms/news",
      Icon: Newspaper,
      count: publishedNewsCount,
      countLabel: "published articles",
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Gallery",
      description: "Collection of photos and documentation media.",
      href: "/admin/cms/gallery",
      Icon: Image,
      count: publishedGalleryCount,
      countLabel: "published items",
      accent: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      border: "border-teal-500/20",
    },
    {
      label: "Pages",
      description: "Static pages like About, Contact, and Privacy Policy.",
      href: "/admin/cms/pages",
      Icon: FileText,
      count: publishedPageCount,
      countLabel: "published pages",
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground text-left">
            Content Management
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground text-left">
          Manage public content for the laboratory website.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-sm hover:border-border/80 text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    card.accent,
                  )}
                >
                  <card.Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-muted-foreground" />
            </div>

            <div className="mt-4 flex items-center gap-1.5 justify-start">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  card.accent,
                  card.border,
                )}
              >
                {card.count.toLocaleString("en-US")}
              </span>
              <span className="text-xs text-muted-foreground">
                {card.countLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
