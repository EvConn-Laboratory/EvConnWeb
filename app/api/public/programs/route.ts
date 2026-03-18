import { NextResponse } from "next/server";
import { getPublishedProgramsAction } from "@/lib/actions/cms";

export const runtime = "nodejs";

function inferProgramType(title: string, description: string | null): "praktikum" | "study_group" {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (text.includes("study group") || text.includes("study_group") || text.includes("belajar bersama")) {
    return "study_group";
  }
  return "praktikum";
}

export async function GET() {
  const programs = await getPublishedProgramsAction();
  const normalized = programs.map((program) => ({
    id: program.id,
    title: program.title,
    description: program.description,
    thumbnailPath: program.thumbnailPath,
    sortOrder: program.sortOrder,
    isPublished: program.isPublished,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    type: inferProgramType(program.title, program.description),
  }));

  return NextResponse.json(normalized);
}
