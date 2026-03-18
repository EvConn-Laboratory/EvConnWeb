"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/animations/variants";
import {
  UserCheck,
  UserX,
  Clock,
  Save,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { saveAttendanceAction } from "@/lib/actions/phase2";

// ─── Types ─────────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "excused" | "late";

export interface StudentRecord {
  studentId: string;
  studentName: string;
  studentNim: string | null;
  currentStatus: AttendanceStatus;
  currentNotes: string | null;
}

interface AttendanceFormProps {
  offeringId: string;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  courseName: string;
  courseCode: string;
  semester: string;
  studentRecords: StudentRecord[];
  defaultSessionDate: string;
  backUrl: string;
}

// ─── Status options ─────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "present",
    label: "Hadir",
    activeClass:
      "border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    value: "late",
    label: "Terlambat",
    activeClass:
      "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    value: "absent",
    label: "Tidak Hadir",
    activeClass:
      "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    value: "excused",
    label: "Izin",
    activeClass:
      "border-gray-500/40 bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
];

// ─── Main component ──────────────────────────────────────────────────────────

export function AttendanceForm({
  offeringId,
  moduleId,
  moduleTitle,
  moduleOrder,
  courseName,
  courseCode,
  semester,
  studentRecords,
  defaultSessionDate,
  backUrl,
}: AttendanceFormProps) {
  const [isPending, startTransition] = useTransition();

  // Per-student form state
  const [formState, setFormState] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >(() =>
    Object.fromEntries(
      studentRecords.map((s) => [
        s.studentId,
        { status: s.currentStatus, notes: s.currentNotes ?? "" },
      ]),
    ),
  );

  const [sessionDate, setSessionDate] = useState(defaultSessionDate);
  const [saveResult, setSaveResult] = useState<{
    success?: boolean;
    error?: string;
    saved?: number;
    updated?: number;
  } | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setAllStatus = (status: AttendanceStatus) =>
    setFormState((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, val]) => [id, { ...val, status }]),
      ),
    );

  const setStudentStatus = (studentId: string, status: AttendanceStatus) =>
    setFormState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));

  const setStudentNotes = (studentId: string, notes: string) =>
    setFormState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    startTransition(async () => {
      setSaveResult(null);
      const records = Object.entries(formState).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        notes: data.notes.trim() || undefined,
      }));

      const res = await saveAttendanceAction({
        offeringId,
        moduleId,
        sessionDate,
        records,
      });

      if ("error" in res) {
        setSaveResult({ error: res.error });
      } else {
        setSaveResult({
          success: true,
          saved: res.data?.saved,
          updated: res.data?.updated,
        });
      }
    });
  };

  // ── Live summary counts ───────────────────────────────────────────────────

  const counts = {
    present: Object.values(formState).filter((s) => s.status === "present")
      .length,
    late: Object.values(formState).filter((s) => s.status === "late").length,
    absent: Object.values(formState).filter((s) => s.status === "absent")
      .length,
    excused: Object.values(formState).filter((s) => s.status === "excused")
      .length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-start gap-4">
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Catat Kehadiran
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {courseCode} &bull; {courseName} &bull; Modul {moduleOrder}:{" "}
            {moduleTitle} &bull; {semester}
          </p>
        </div>
      </motion.div>

      {/* Save result banner */}
      {saveResult && (
        <motion.div
          variants={fadeUp}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4",
            saveResult.success
              ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-300"
              : "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300",
          )}
        >
          {saveResult.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p className="text-sm font-medium">
            {saveResult.success
              ? `Absensi berhasil disimpan — ${saveResult.saved} record baru, ${saveResult.updated} diperbarui.`
              : saveResult.error}
          </p>
        </motion.div>
      )}

      {/* Session date + bulk actions */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-card p-5"
      >
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Tanggal Sesi
          </label>
          <Input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllStatus("present")}
            className="gap-1.5 border-teal-500/30 text-teal-600 hover:bg-teal-500/10 dark:text-teal-400"
          >
            <UserCheck className="h-4 w-4" />
            Semua Hadir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllStatus("absent")}
            className="gap-1.5 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            <UserX className="h-4 w-4" />
            Semua Tidak Hadir
          </Button>
        </div>
      </motion.div>

      {/* Live summary */}
      <motion.div
        variants={fadeUp}
        custom={2}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {(
          [
            {
              label: "Hadir",
              value: counts.present,
              bg: "bg-teal-500/10",
              color: "text-teal-600 dark:text-teal-400",
            },
            {
              label: "Terlambat",
              value: counts.late,
              bg: "bg-amber-500/10",
              color: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Tidak Hadir",
              value: counts.absent,
              bg: "bg-red-500/10",
              color: "text-red-600 dark:text-red-400",
            },
            {
              label: "Izin",
              value: counts.excused,
              bg: "bg-gray-500/10",
              color: "text-gray-600 dark:text-gray-400",
            },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-bold tabular-nums",
                s.bg,
                s.color,
              )}
            >
              {s.value}
            </div>
            <span className="text-sm font-medium text-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Student list */}
      {studentRecords.length === 0 ? (
        <motion.div
          variants={fadeUp}
          custom={3}
          className="rounded-2xl border border-border bg-card p-12 text-center"
        >
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">
            Belum ada mahasiswa terdaftar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Import atau daftarkan mahasiswa ke mata kuliah ini terlebih dahulu.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="space-y-2">
          {studentRecords.map((student, index) => {
            const state = formState[student.studentId];
            return (
              <motion.div
                key={student.studentId}
                variants={fadeUp}
                custom={index}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  {/* Student info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {student.studentName}
                    </p>
                    {student.studentNim && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {student.studentNim}
                      </p>
                    )}
                  </div>

                  {/* Status toggle buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setStudentStatus(student.studentId, opt.value)
                        }
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                          state?.status === opt.value
                            ? opt.activeClass
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Notes input */}
                  <Input
                    placeholder="Catatan (opsional)"
                    value={state?.notes ?? ""}
                    onChange={(e) =>
                      setStudentNotes(student.studentId, e.target.value)
                    }
                    className="w-full sm:w-52"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Save button */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between gap-3 border-t border-border pt-4"
      >
        <p className="text-xs text-muted-foreground">
          {studentRecords.length} mahasiswa terdaftar
        </p>
        <Button
          onClick={handleSubmit}
          disabled={isPending || studentRecords.length === 0}
          className="gap-2"
        >
          {isPending ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Absensi
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
