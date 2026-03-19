"use client";

import { useMemo, useState, useTransition } from "react";
import { Award, Ban, CheckCircle2, AlertCircle } from "lucide-react";
import { issueCertificateAction, revokeCertificateAction } from "@/lib/actions/phase2";
import { cn } from "@/lib/utils";

type Candidate = {
  offeringId: string;
  offeringLabel: string;
  studentId: string;
  studentName: string;
  studentNim: string | null;
};

type CertificateRow = {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  studentName: string;
  studentNim: string | null;
  courseName: string;
  courseCode: string;
  offeringLabel: string;
};

export function CertificateManager({
  candidates,
  certificates,
}: {
  candidates: Candidate[];
  certificates: CertificateRow[];
}) {
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(
    candidates[0]?.offeringId ?? "",
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const offerings = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of candidates) {
      if (!map.has(c.offeringId)) map.set(c.offeringId, c.offeringLabel);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [candidates]);

  const students = useMemo(
    () => candidates.filter((c) => c.offeringId === selectedOfferingId),
    [candidates, selectedOfferingId],
  );

  function issueCertificate() {
    setError(null);
    setMessage(null);

    if (!selectedOfferingId || !selectedStudentId) {
      setError("Please select both an offering and a student first.");
      return;
    }

    startTransition(async () => {
      const res = await issueCertificateAction({
        studentId: selectedStudentId,
        offeringId: selectedOfferingId,
      });

      if ("error" in res) {
        setError(res.error);
        return;
      }

      const certNo = res.data?.certificateNumber ?? "(number unavailable)";
      setMessage(`Certificate successfully issued: ${certNo}`);
      window.location.reload();
    });
  }

  function revokeCertificate(certificateId: string) {
    const reason = window.prompt("Enter reason for revoking certificate:");
    if (!reason || reason.trim().length === 0) return;

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const res = await revokeCertificateAction(certificateId, reason.trim());
      if ("error" in res) {
        setError(res.error);
        return;
      }

      setMessage("Certificate successfully revoked.");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Issue Certificate</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground text-left block">Offering</label>
            <select
              value={selectedOfferingId}
              onChange={(e) => {
                setSelectedOfferingId(e.target.value);
                setSelectedStudentId("");
              }}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select offering</option>
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground text-left block">Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              disabled={!selectedOfferingId}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.studentName}
                  {s.studentNim ? ` (${s.studentNim})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={issueCertificate}
            disabled={isPending}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all active:scale-95",
              isPending && "opacity-60",
            )}
          >
            <Award className="h-4 w-4" />
            {isPending ? "Issuing..." : "Issue Certificate"}
          </button>

          <p className="text-xs text-muted-foreground text-left">
            The system will prevent duplicate issuance for the same offering.
          </p>
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        {message && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Issued Certificates</h2>

        {certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-left">No certificates issued yet.</p>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const revoked = !!cert.revokedAt;
              return (
                <div key={cert.id} className="rounded-xl border border-border bg-background p-4 text-left">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cert.certificateNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.courseCode} · {cert.courseName} · {cert.offeringLabel}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cert.studentName}
                        {cert.studentNim ? ` (${cert.studentNim})` : ""}
                        {" · "}
                        Issued {new Date(cert.issuedAt).toLocaleDateString("en-US")}
                      </p>
                      {revoked && cert.revokedReason && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          Revoked: {cert.revokedReason}
                        </p>
                      )}
                    </div>

                    {revoked ? (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                        Revoked
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => revokeCertificate(cert.id)}
                        disabled={isPending}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-60 dark:text-red-400"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
