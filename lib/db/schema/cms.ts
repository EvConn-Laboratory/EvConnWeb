import { pgTable, text, uuid, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailPath: text("thumbnail_path"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  thumbnailPath: text("thumbnail_path"),
  authorId: uuid("author_id").notNull(),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const newsImages = pgTable("news_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  newsId: uuid("news_id")
    .notNull()
    .references(() => newsArticles.id),
  imagePath: text("image_path").notNull(),
  caption: text("caption"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  description: text("description"),
  filePath: text("file_path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cmsPages = pgTable("cms_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;
export type NewsImage = typeof newsImages.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;
export type CmsPage = typeof cmsPages.$inferSelect;
export type NewCmsPage = typeof cmsPages.$inferInsert;
