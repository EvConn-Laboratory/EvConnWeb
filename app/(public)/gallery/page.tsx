import type { Metadata } from "next";
import { getPublishedGalleryAction } from "@/lib/actions/cms";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = { title: "Gallery" };
export const revalidate = 300;

export default async function GalleryPage() {
  const items = await getPublishedGalleryAction();
  const normalized = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    filePath: item.filePath,
    sortOrder: item.sortOrder,
  }));

  return (
    <div className="bg-background">
      <div className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Gallery
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Lab Documentation
            </h1>
            <p className="text-sm text-muted-foreground">
              {normalized.length} photo{normalized.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <GalleryClient items={normalized} />
    </div>
  );
}
