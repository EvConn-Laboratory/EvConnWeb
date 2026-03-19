import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

type UploadCategory = "submissions" | "materials" | "gallery";

function validateCategory(value: string | null): UploadCategory {
  if (value === "submissions" || value === "materials" || value === "gallery") return value;
  return "submissions";
}

function toWebPath(parts: string[]): string {
  return `/${parts.join("/")}`;
}

const ALLOWED_TYPES: Record<UploadCategory, string[]> = {
  submissions: ["application/pdf"],
  gallery: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  materials: [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const cat = validateCategory(formData.get("category")?.toString() ?? null);
  const maybeFile = formData.get("file");

  if (cat === "materials" || cat === "gallery") {
    const role = session.user.role;
    if (cat === "gallery" && role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }
    if (role !== "super_admin" && role !== "assistant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (maybeFile.size === 0) {
    return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
  }

  if (maybeFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File size exceeds 50 MB" }, { status: 400 });
  }

  const allowedTypes = ALLOWED_TYPES[cat];
  if (!allowedTypes.includes(maybeFile.type)) {
    return NextResponse.json(
      { error: `File type '${maybeFile.type}' is not allowed for category '${cat}'` },
      { status: 400 },
    );
  }

  const ext = maybeFile.name.split(".").pop()?.toLowerCase() ?? "bin";
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const filename = `${randomUUID()}.${ext}`;

  const relativeParts = ["uploads", cat, year, month, filename];
  const uploadDir = path.join(process.cwd(), "public", "uploads", cat, year, month);
  const fullFilePath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await maybeFile.arrayBuffer();
  await writeFile(fullFilePath, Buffer.from(bytes));

  return NextResponse.json({
    success: true,
    filePath: toWebPath(relativeParts),
    fileName: maybeFile.name,
    fileSize: maybeFile.size,
  });
}
