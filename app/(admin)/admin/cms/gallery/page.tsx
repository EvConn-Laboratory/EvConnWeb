import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Image, Plus } from "lucide-react";
import { getAllGalleryItemsAction } from "@/lib/actions/cms";
import { db } from "@/lib/db";
import { galleryItems } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Gallery | CMS | Admin" };

// ─── Toggle action ────────────────────────────────────────────────────────────

async function handleToggleGallery(formData: FormData) {
  "use server";
  const session = await (await import("@/lib/auth/session")).getSession();
  if (!session || session.user.role !== "super_admin") return;

  const id = formData.get("id") as string;
  const isPublished = formData.get("isPublished") === "true";
  if (!id) return;

  await db
    .update(galleryItems)
    .set({ isPublished: !isPublished })
    .where(eq(galleryItems.id, id));

  revalidatePath("/admin/cms/gallery");
  revalidatePath("/gallery");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCmsGalleryPage() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") redirect("/admin/dashboard");

  const items = await getAllGalleryItemsAction();

  const publishedCount = items.filter((i) => i.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Image className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Gallery
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length === 0
              ? "Belum ada item"
              : `${items.length} item · `}
            {items.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {publishedCount} diterbitkan
              </span>
            )}
          </p>
        </div>

        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-3.5 w-3.5" />
          Tambah Item
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Urutan
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Judul
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  File
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    Belum ada item gallery.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Sort order */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.sortOrder}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {item.title ?? (
                          <span className="italic text-muted-foreground">
                            Tanpa judul
                          </span>
                        )}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </td>

                    {/* File path */}
                    <td className="px-4 py-3 max-w-xs">
                      <span className="font-mono text-xs text-muted-foreground truncate block max-w-[200px]">
                        {item.filePath}
                      </span>
                    </td>

                    {/* Published status */}
                    <td className="px-4 py-3">
                      {item.isPublished ? (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                          Diterbitkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Disembunyikan
                        </span>
                      )}
                    </td>

                    {/* Toggle action */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <form action={handleToggleGallery}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="isPublished"
                            value={String(item.isPublished)}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="xs"
                            className={cn(
                              "gap-1",
                              item.isPublished
                                ? "text-muted-foreground"
                                : "text-green-600 border-green-500/30 hover:bg-green-500/10",
                            )}
                          >
                            {item.isPublished ? "Sembunyikan" : "Tampilkan"}
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
