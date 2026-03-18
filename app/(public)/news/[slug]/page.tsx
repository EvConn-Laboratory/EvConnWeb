import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { getNewsArticleBySlugAction } from "@/lib/actions/cms";

type Props = { params: Promise<{ slug: string }> };

function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadTime(html: string) {
  const words = html.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getNewsArticleBySlugAction(slug);
  if (!result) return { title: "Berita" };
  const { article } = result;
  const desc = article.content
    ? article.content.replace(/<[^>]+>/g, "").slice(0, 160)
    : "";
  return {
    title: article.title,
    description: desc,
    openGraph: {
      title: article.title,
      description: desc,
      images: article.thumbnailPath ? [article.thumbnailPath] : [],
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const result = await getNewsArticleBySlugAction(slug);
  if (!result) redirect("/news");

  const { article, images } = result;
  const readTime = article.content ? estimateReadTime(article.content) : null;

  return (
    <div className="bg-background">
      {/* Thumbnail hero */}
      {article.thumbnailPath && (
        <div className="relative h-72 w-full overflow-hidden border-b border-border md:h-96 lg:h-[440px]">
          <Image
            src={article.thumbnailPath}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Article */}
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        {/* Back */}
        <Link
          href="/news"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Berita
        </Link>

        {/* Meta */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Berita
          </span>
          {article.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(new Date(article.publishedAt))}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Tim EvConn Laboratory
          </span>
          {readTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readTime} menit baca
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {article.title}
        </h1>

        {/* Body */}
        {article.content && (
          <div
            className="prose prose-invert mt-8 max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-7
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-li:text-muted-foreground
              prose-blockquote:border-primary prose-blockquote:text-muted-foreground
              prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none
              prose-img:rounded-xl prose-img:border prose-img:border-border
              prose-hr:border-border"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* Gallery */}
        {images && images.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Galeri Foto
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((img, i) => (
                <figure key={i} className="overflow-hidden rounded-xl border border-border">
                  <div className="relative aspect-video">
                    <Image
                      src={img.imagePath}
                      alt={img.caption ?? `Foto ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {img.caption && (
                    <figcaption className="border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Semua Berita
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/news/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Bagikan <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
