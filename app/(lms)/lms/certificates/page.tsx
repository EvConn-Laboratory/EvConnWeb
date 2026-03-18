import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { certificates, courseOfferings, courses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Award, Download, Shield, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sertifikat Saya — EvConn LMS" };

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const studentId = session.user.id;

  // ── Fetch certificates with course info ───────────────────────────────
  const studentCerts = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      issuedAt: certificates.issuedAt,
      filePath: certificates.filePath,
      revokedAt: certificates.revokedAt,
      revokedReason: certificates.revokedReason,
      courseName: courses.name,
      courseCode: courses.code,
      semester: courseOfferings.semester,
      academicYear: courseOfferings.academicYear,
    })
    .from(certificates)
    .innerJoin(courseOfferings, eq(certificates.offeringId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(certificates.studentId, studentId))
    .orderBy(desc(certificates.issuedAt));

  const totalActive = studentCerts.filter((c) => !c.revokedAt).length;
  const totalRevoked = studentCerts.filter((c) => !!c.revokedAt).length;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sertifikat Saya
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sertifikat yang Anda raih setelah menyelesaikan seluruh modul.
          </p>
        </div>
        {studentCerts.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{totalActive}</span>{" "}
              aktif
            </span>
            {totalRevoked > 0 && (
              <span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {totalRevoked}
                </span>{" "}
                dicabut
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {studentCerts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Award className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold text-foreground">
            Belum ada sertifikat
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Selesaikan semua modul untuk mendapatkan sertifikat penyelesaian
            dari EvConn Laboratory.
          </p>
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link href="/lms/dashboard">
              <GraduationCap className="h-4 w-4" />
              Lihat Mata Kuliah Saya
            </Link>
          </Button>
        </div>
      ) : (
        /* ── Certificate cards grid ─────────────────────────────────── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studentCerts.map((cert) => {
            const isRevoked = !!cert.revokedAt;
            return (
              <div
                key={cert.id}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow",
                  isRevoked
                    ? "border-red-500/25 opacity-70"
                    : "border-border hover:shadow-md",
                )}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isRevoked
                        ? "bg-red-500/10 text-red-500"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    <Award className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      isRevoked
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-green-500/10 text-green-600 dark:text-green-400",
                    )}
                  >
                    {isRevoked ? "Dicabut" : "Aktif"}
                  </span>
                </div>

                {/* Certificate info */}
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-foreground">
                    {cert.courseName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {cert.courseCode} &bull; {cert.semester}{" "}
                    {cert.academicYear}
                  </p>
                  <p className="pt-2 font-mono text-xs text-muted-foreground">
                    {cert.certificateNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diterbitkan:{" "}
                    {new Date(cert.issuedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {isRevoked && cert.revokedReason && (
                    <p className="pt-1 text-xs text-red-600 dark:text-red-400">
                      Alasan: {cert.revokedReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!isRevoked && (
                  <div className="mt-auto flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      asChild
                    >
                      <Link
                        href={`/verify/${cert.certificateNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Verifikasi
                      </Link>
                    </Button>
                    {cert.filePath ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        asChild
                      >
                        <a href={cert.filePath} download>
                          <Download className="h-3.5 w-3.5" />
                          Unduh
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 cursor-not-allowed opacity-50"
                        disabled
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
