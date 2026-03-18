"use server";

import { db } from "@/lib/db";
import {
  programs,
  newsArticles,
  newsImages,
  galleryItems,
  cmsPages,
  auditLogs,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, asc, desc, and } from "drizzle-orm";
import { z } from "zod";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { error: string };

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: admin only");
  }
  return session;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const programSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  thumbnailPath: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.coerce.boolean().default(false),
});

const newsArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(300)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  content: z.string().min(1, "Content is required"),
  thumbnailPath: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

const newsImageSchema = z.object({
  newsId: z.string().uuid("Invalid article ID"),
  imagePath: z.string().min(1, "Image path is required"),
  caption: z.string().max(500).optional(),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

const galleryItemSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  filePath: z.string().min(1, "File path is required"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.coerce.boolean().default(true),
});

const cmsPageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().default(""),
  isPublished: z.coerce.boolean().default(false),
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRAMS
// ═══════════════════════════════════════════════════════════════════════════════

export async function createProgramAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parse = programSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    thumbnailPath: formData.get("thumbnailPath") || undefined,
    sortOrder: formData.get("sortOrder") ?? 0,
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const [created] = await db
    .insert(programs)
    .values(parse.data)
    .returning({ id: programs.id });

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "program_created",
    entity: "programs",
    entityId: created.id,
    newData: parse.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/programs");
  revalidatePath("/programs");
  return { success: true, data: { id: created.id } };
}

export async function updateProgramAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parse = programSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    thumbnailPath: formData.get("thumbnailPath") || undefined,
    sortOrder: formData.get("sortOrder") ?? 0,
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const [old] = await db
    .select()
    .from(programs)
    .where(eq(programs.id, id))
    .limit(1);

  if (!old) return { error: "Program not found" };

  await db
    .update(programs)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(eq(programs.id, id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "program_updated",
    entity: "programs",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: parse.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/programs");
  revalidatePath("/programs");
  return { success: true };
}

export async function deleteProgramAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const [old] = await db
    .select()
    .from(programs)
    .where(eq(programs.id, id))
    .limit(1);

  if (!old) return { error: "Program not found" };

  await db.delete(programs).where(eq(programs.id, id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "program_deleted",
    entity: "programs",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/programs");
  revalidatePath("/programs");
  return { success: true };
}

export async function reorderProgramsAction(orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(programs)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(programs.id, orderedIds[i]));
  }

  revalidatePath("/admin/cms/programs");
  revalidatePath("/programs");
  return { success: true };
}

export async function toggleProgramPublishedAction(
  id: string,
  isPublished: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  await db
    .update(programs)
    .set({ isPublished, updatedAt: new Date() })
    .where(eq(programs.id, id));

  revalidatePath("/admin/cms/programs");
  revalidatePath("/programs");
  return { success: true };
}

export async function getPublishedProgramsAction() {
  try {
    return await db
      .select()
      .from(programs)
      .where(eq(programs.isPublished, true))
      .orderBy(asc(programs.sortOrder));
  } catch {
    return [];
  }
}

export async function getAllProgramsAction() {
  await requireAdmin();
  return db.select().from(programs).orderBy(asc(programs.sortOrder));
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEWS ARTICLES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getNewsArticleByIdAction(
  id: string,
): Promise<ActionResult<typeof newsArticles.$inferSelect>> {
  await requireAdmin();
  const [article] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);
  if (!article) return { error: "Artikel tidak ditemukan." };
  return { success: true, data: article };
}

export async function createNewsArticleAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await requireAdmin();

  const parse = newsArticleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    content: formData.get("content"),
    thumbnailPath: formData.get("thumbnailPath") || undefined,
    status: formData.get("status") ?? "draft",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: newsArticles.id })
    .from(newsArticles)
    .where(eq(newsArticles.slug, parse.data.slug))
    .limit(1);

  if (existing)
    return { error: `Slug "${parse.data.slug}" is already taken. Choose a different slug.` };

  const publishedAt =
    parse.data.status === "published" ? new Date() : undefined;

  const [created] = await db
    .insert(newsArticles)
    .values({
      ...parse.data,
      authorId: session.user.id,
      publishedAt: publishedAt ?? null,
    })
    .returning({ id: newsArticles.id, slug: newsArticles.slug });

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "news_article_created",
    entity: "news_articles",
    entityId: created.id,
    newData: { title: parse.data.title, slug: parse.data.slug } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/news");
  revalidatePath("/news");
  return { success: true, data: { id: created.id, slug: created.slug } };
}

export async function updateNewsArticleAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parse = newsArticleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    content: formData.get("content"),
    thumbnailPath: formData.get("thumbnailPath") || undefined,
    status: formData.get("status") ?? "draft",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  // Check slug uniqueness excluding self
  const [existing] = await db
    .select({ id: newsArticles.id })
    .from(newsArticles)
    .where(eq(newsArticles.slug, parse.data.slug))
    .limit(1);

  if (existing && existing.id !== id)
    return { error: `Slug "${parse.data.slug}" is already taken.` };

  const [old] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);

  if (!old) return { error: "Article not found" };

  // Set publishedAt only when transitioning from draft to published
  const publishedAt =
    old.status !== "published" && parse.data.status === "published"
      ? new Date()
      : old.publishedAt;

  await db
    .update(newsArticles)
    .set({
      ...parse.data,
      publishedAt: publishedAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(newsArticles.id, id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "news_article_updated",
    entity: "news_articles",
    entityId: id,
    oldData: { title: old.title, status: old.status } as unknown as Record<string, unknown>,
    newData: { title: parse.data.title, status: parse.data.status } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/news");
  revalidatePath("/news");
  revalidatePath(`/news/${parse.data.slug}`);
  return { success: true };
}

export async function publishNewsArticleAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const [article] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);

  if (!article) return { error: "Article not found" };
  if (article.status === "published") return { error: "Article is already published" };

  const now = new Date();
  await db
    .update(newsArticles)
    .set({ status: "published", publishedAt: now, updatedAt: now })
    .where(eq(newsArticles.id, id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "news_article_published",
    entity: "news_articles",
    entityId: id,
    newData: { publishedAt: now } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/news");
  revalidatePath("/news");
  revalidatePath(`/news/${article.slug}`);
  return { success: true };
}

export async function unpublishNewsArticleAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  await db
    .update(newsArticles)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(newsArticles.id, id));

  revalidatePath("/admin/cms/news");
  revalidatePath("/news");
  return { success: true };
}

export async function deleteNewsArticleAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const [article] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);

  if (!article) return { error: "Article not found" };

  // Delete associated images first
  await db.delete(newsImages).where(eq(newsImages.newsId, id));
  await db.delete(newsArticles).where(eq(newsArticles.id, id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "news_article_deleted",
    entity: "news_articles",
    entityId: id,
    oldData: { title: article.title, slug: article.slug } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/news");
  revalidatePath("/news");
  return { success: true };
}

export async function getPublishedNewsAction(limit = 20, offset = 0) {
  try {
    return await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.status, "published"))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit)
      .offset(offset);
  } catch {
    return [];
  }
}

export async function getNewsArticleBySlugAction(slug: string) {
  try {
    const [article] = await db
      .select()
      .from(newsArticles)
      .where(and(eq(newsArticles.slug, slug), eq(newsArticles.status, "published")))
      .limit(1);

    if (!article) return null;

    const images = await db
      .select()
      .from(newsImages)
      .where(eq(newsImages.newsId, article.id))
      .orderBy(asc(newsImages.orderIndex));

    return { article, images };
  } catch {
    return null;
  }
}

export async function getAllNewsAction() {
  await requireAdmin();
  return db
    .select()
    .from(newsArticles)
    .orderBy(desc(newsArticles.updatedAt));
}

// ─── News Images ──────────────────────────────────────────────────────────────

export async function addNewsImageAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parse = newsImageSchema.safeParse({
    newsId: formData.get("newsId"),
    imagePath: formData.get("imagePath"),
    caption: formData.get("caption") || undefined,
    orderIndex: formData.get("orderIndex") ?? 0,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const [created] = await db
    .insert(newsImages)
    .values(parse.data)
    .returning({ id: newsImages.id });

  revalidatePath("/admin/cms/news");
  return { success: true, data: { id: created.id } };
}

export async function deleteNewsImageAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  await db.delete(newsImages).where(eq(newsImages.id, id));

  revalidatePath("/admin/cms/news");
  return { success: true };
}

export async function reorderNewsImagesAction(
  newsId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(newsImages)
      .set({ orderIndex: i })
      .where(and(eq(newsImages.id, orderedIds[i]), eq(newsImages.newsId, newsId)));
  }

  revalidatePath("/admin/cms/news");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════════════════════════

export async function createGalleryItemAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parse = galleryItemSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    filePath: formData.get("filePath"),
    sortOrder: formData.get("sortOrder") ?? 0,
    isPublished: formData.get("isPublished") !== "false",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const [created] = await db
    .insert(galleryItems)
    .values(parse.data)
    .returning({ id: galleryItems.id });

  revalidatePath("/admin/cms/gallery");
  revalidatePath("/gallery");
  return { success: true, data: { id: created.id } };
}

export async function updateGalleryItemAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parse = galleryItemSchema.partial().safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    sortOrder: formData.get("sortOrder") ?? undefined,
    isPublished:
      formData.get("isPublished") !== null
        ? formData.get("isPublished") !== "false"
        : undefined,
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  await db
    .update(galleryItems)
    .set(parse.data)
    .where(eq(galleryItems.id, id));

  revalidatePath("/admin/cms/gallery");
  revalidatePath("/gallery");
  return { success: true };
}

export async function deleteGalleryItemAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  await db.delete(galleryItems).where(eq(galleryItems.id, id));

  revalidatePath("/admin/cms/gallery");
  revalidatePath("/gallery");
  return { success: true };
}

export async function reorderGalleryAction(orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(galleryItems)
      .set({ sortOrder: i })
      .where(eq(galleryItems.id, orderedIds[i]));
  }

  revalidatePath("/admin/cms/gallery");
  revalidatePath("/gallery");
  return { success: true };
}

export async function getPublishedGalleryAction() {
  try {
    return await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.isPublished, true))
      .orderBy(asc(galleryItems.sortOrder));
  } catch {
    return [];
  }
}

export async function getAllGalleryItemsAction() {
  await requireAdmin();
  return db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CMS PAGES (Static Content)
// ═══════════════════════════════════════════════════════════════════════════════

export async function upsertCmsPageAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parse = cmsPageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    content: formData.get("content") ?? "",
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parse.success)
    return { error: parse.error.issues[0]?.message ?? "Validation error" };

  const { slug, title, content, isPublished } = parse.data;

  const [existing] = await db
    .select({ id: cmsPages.id })
    .from(cmsPages)
    .where(eq(cmsPages.slug, slug))
    .limit(1);

  let pageId: string;

  if (existing) {
    await db
      .update(cmsPages)
      .set({ title, content, isPublished, updatedBy: session.user.id, updatedAt: new Date() })
      .where(eq(cmsPages.id, existing.id));
    pageId = existing.id;
  } else {
    const [created] = await db
      .insert(cmsPages)
      .values({ slug, title, content, isPublished, updatedBy: session.user.id })
      .returning({ id: cmsPages.id });
    pageId = created.id;
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "cms_page_updated",
    entity: "cms_pages",
    entityId: pageId,
    newData: { slug, title, isPublished } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/cms/pages");
  revalidatePath(`/${slug}`);
  return { success: true, data: { id: pageId } };
}

export async function getCmsPageBySlugAction(slug: string) {
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.slug, slug))
    .limit(1);

  return page ?? null;
}

export async function getPublishedCmsPageBySlugAction(slug: string) {
  try {
    const [page] = await db
      .select()
      .from(cmsPages)
      .where(and(eq(cmsPages.slug, slug), eq(cmsPages.isPublished, true)))
      .limit(1);

    return page ?? null;
  } catch {
    return null;
  }
}

export async function getAllCmsPagesAction() {
  await requireAdmin();
  return db.select().from(cmsPages).orderBy(asc(cmsPages.slug));
}

export async function toggleCmsPagePublishedAction(
  id: string,
  isPublished: boolean,
): Promise<ActionResult> {
  const session = await requireAdmin();

  await db
    .update(cmsPages)
    .set({ isPublished, updatedBy: session.user.id, updatedAt: new Date() })
    .where(eq(cmsPages.id, id));

  revalidatePath("/admin/cms/pages");
  return { success: true };
}
