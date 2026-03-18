import { db } from "@/lib/db";
import {
  studyGroupInvites,
  courseOfferings,
  courses,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { AcceptButton } from "./AcceptButton";

type PageProps = { params: Promise<{ token: string }> };

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;

  // Fetch invite with relations
  const rows = await db
    .select({
      id: studyGroupInvites.id,
      offeringId: studyGroupInvites.offeringId,
      email: studyGroupInvites.email,
      maxUses: studyGroupInvites.maxUses,
      useCount: studyGroupInvites.useCount,
      expiresAt: studyGroupInvites.expiresAt,
      isRevoked: studyGroupInvites.isRevoked,
      inviterName: users.name,
      courseName: courses.name,
      courseCode: courses.code,
      semester: courseOfferings.semester,
      academicYear: courseOfferings.academicYear,
    })
    .from(studyGroupInvites)
    .leftJoin(courseOfferings, eq(studyGroupInvites.offeringId, courseOfferings.id))
    .leftJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(users, eq(studyGroupInvites.invitedBy, users.id))
    .where(eq(studyGroupInvites.token, token))
    .limit(1);

  const invite = rows[0];
  const session = await getSession();

  // Validity checks
  let invalidReason: string | null = null;
  if (!invite) {
    invalidReason = "Tautan undangan tidak valid atau tidak ditemukan.";
  } else if (invite.isRevoked) {
    invalidReason = "Undangan ini telah dicabut.";
  } else if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    invalidReason = "Undangan ini telah kedaluwarsa.";
  } else if (
    invite.maxUses !== null &&
    invite.useCount !== null &&
    invite.useCount >= invite.maxUses
  ) {
    invalidReason = "Kuota undangan ini sudah penuh.";
  }

  // Invalid invite
  if (invalidReason) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-lg font-bold text-foreground">
              Undangan Tidak Valid
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{invalidReason}</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ke Beranda <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remaining =
    invite.maxUses !== null && invite.useCount !== null
      ? invite.maxUses - invite.useCount
      : null;

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        {/* Invite card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Undangan Study Group
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Anda diundang untuk bergabung ke
            </p>
          </div>

          {/* Course info */}
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-lg font-bold text-foreground">
              {invite.courseName ?? "—"}
            </p>
            <p className="mt-0.5 font-mono text-sm text-primary">
              {invite.courseCode ?? "—"}
            </p>
            {(invite.semester || invite.academicYear) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {[invite.semester, invite.academicYear]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="mb-6 space-y-3">
            {invite.inviterName && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <UserCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Diundang oleh</p>
                  <p className="text-sm font-medium text-foreground">
                    {invite.inviterName}
                  </p>
                </div>
              </div>
            )}
            {invite.expiresAt && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Berlaku hingga
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(invite.expiresAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            {remaining !== null && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sisa slot</p>
                  <p className="text-sm font-medium text-foreground">
                    {remaining} dari {invite.maxUses}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          {session ? (
            <div>
              <p className="mb-3 text-center text-xs text-muted-foreground">
                Masuk sebagai{" "}
                <span className="font-medium text-foreground">
                  {session.user.name}
                </span>
              </p>
              <AcceptButton token={token} />
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/login?next=/join/${token}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Login untuk Bergabung <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                Belum punya akun?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Daftar gratis
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
