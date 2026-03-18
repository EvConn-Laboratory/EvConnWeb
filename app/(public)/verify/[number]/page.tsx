import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  BadgeCheck,
  BadgeX,
  ArrowLeft,
  Hash,
  User,
  Calendar,
} from "lucide-react";
import { verifyCertificateAction } from "@/lib/actions/phase2";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return { title: `Verify Certificate ${number}` };
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { number } = await params;
  const result = await verifyCertificateAction(number);

  const isValid = result.valid;
  const cert = isValid ? result.certificate : null;

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Certificate Verification
              </h1>
              <p className="text-sm text-muted-foreground">
                EvConn Laboratory
              </p>
            </div>
          </div>

          {/* Certificate number */}
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
            <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-mono text-sm text-foreground">{number}</span>
          </div>

          {/* Result */}
          {!isValid ? (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
                <BadgeX className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Tidak Valid
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.reason ?? "Sertifikat tidak dapat diverifikasi."}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/8 px-4 py-3">
                <BadgeCheck className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  Sertifikat Valid
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="text-sm font-medium text-foreground">
                      {cert!.studentName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Nomor Sertifikat
                    </p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {cert!.number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tanggal Terbit
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(cert!.issuedAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
