import { NextResponse } from "next/server";
import { getPublishedGalleryAction } from "@/lib/actions/cms";

export const runtime = "nodejs";

const SPANS: Array<"tall" | "wide" | "normal"> = ["normal", "tall", "normal", "wide"];

export async function GET() {
  const items = await getPublishedGalleryAction();
  const normalized = items.map((item, index) => ({
    id: item.id,
    title: item.title ?? undefined,
    description: item.description ?? undefined,
    filePath: item.filePath,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    span: SPANS[index % SPANS.length],
  }));

  return NextResponse.json(normalized);
}
