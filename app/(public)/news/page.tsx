import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Calendar, Clock, ArrowRight, Newspaper } from "lucide-react";

export const metadata: Metadata = { title: "News" };
export const revalidate = 300;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "");
}

function excerpt(content: string, max = 160) {
  const text = stripHtml(content);
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export default async function NewsPage() {
  const articles = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.status, "published"))
    .orderBy(desc(newsArticles.publishedAt));

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            From the Lab
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              News
            </h1>
            {articles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {articles.length} article{articles.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Newspaper className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No news yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Articles will appear here once they are published.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured */}
            {featured && (
              <Link
                href={`/news/${featured.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/30"
              >
                <div className="grid lg:grid-cols-2">
                  {featured.thumbnailPath ? (
                    <div className="relative h-64 lg:h-full lg:min-h-[280px]">
                      <Image
                        src={featured.thumbnailPath}
                        alt={featured.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-muted lg:h-full lg:min-h-[280px]">
                      <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-8">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Latest
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-3">
                      {featured.title}
                    </h2>
                    {featured.content && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {excerpt(featured.content, 200)}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {featured.publishedAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(new Date(featured.publishedAt))}
                        </span>
                      )}
                      {featured.content && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {estimateReadTime(featured.content)} min read
                        </span>
                      )}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      Read more{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
                  >
                    {article.thumbnailPath ? (
                      <div className="relative h-44 overflow-hidden">
                        <Image
                          src={article.thumbnailPath}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-muted">
                        <Newspaper className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {article.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(new Date(article.publishedAt))}
                          </span>
                        )}
                        {article.content && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {estimateReadTime(article.content)}m
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.content && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                          {excerpt(article.content)}
                        </p>
                      )}
                      <span className="mt-auto pt-4 text-xs font-medium text-primary">
                        Read more →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom links */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-10 text-sm">
          <Link
            href="/about"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <span className="text-border">·</span>
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
