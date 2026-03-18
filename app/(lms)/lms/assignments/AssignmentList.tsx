"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/animations/variants";

export type AssignmentListItem = {
  assignmentId: string;
  title: string;
  type: string;
  format: string;
  maxScore?: string | null;
  deadline: string | null;
  moduleId: string;
  moduleTitle: string;
  isRequired: boolean;
  submittedAt: string | null;
  isLate: boolean;
  score: string | null;
  gradeStatus: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  tugas_rumah: "Tugas Rumah",
  tugas_praktikum: "Tugas Praktikum",
  study_group_task: "Study Group",
};

const TYPE_COLOR: Record<string, string> = {
  tugas_rumah: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  tugas_praktikum: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  study_group_task: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

function DeadlineTag({ deadline, isLate }: { deadline: string | null; isLate: boolean }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const hoursLeft = (d.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isUrgent = hoursLeft < 24 && hoursLeft > 0;
  const isPast = hoursLeft <= 0;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[11px]",
        isPast || isLate
          ? "text-red-500"
          : isUrgent
            ? "text-amber-500"
            : "text-muted-foreground",
      )}
    >
      <Clock className="h-3 w-3" />
      {isPast
        ? "Tutup"
        : isUrgent
          ? `${Math.ceil(hoursLeft)}j lagi`
          : d.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
    </span>
  );
}

function AssignmentCard({
  item,
  index,
}: {
  item: AssignmentListItem;
  index: number;
}) {
  const isGraded = item.score !== null && item.gradeStatus === "published";
  const isSubmitted = !!item.submittedAt;
  const isPending = isSubmitted && !isGraded;

  return (
    <motion.div variants={fadeUp} custom={index} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
      <Link href={`/lms/modules/${item.moduleId}`} className="group block" key={item.assignmentId}>
        <div
          className={cn(
            "rounded-xl border bg-card p-4 transition-shadow hover:shadow-md",
            isGraded
              ? "border-green-500/20"
              : isPending
                ? "border-blue-500/20"
                : "border-border",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Type badge */}
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    TYPE_COLOR[item.type] ?? "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {TYPE_LABEL[item.type] ?? item.type}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {item.format === "mcq" ? "MCQ" : "Essay/PDF"}
                </span>
                {item.isRequired && (
                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                    Wajib
                  </span>
                )}
              </div>

              {/* Title */}
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.moduleTitle}
              </p>

              {/* Deadline */}
              <div className="mt-1.5">
                <DeadlineTag deadline={item.deadline} isLate={item.isLate} />
              </div>
            </div>

            {/* Status / score */}
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              {isGraded ? (
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {Number(item.score).toFixed(0)}
                    </span>
                    {item.maxScore && (
                      <span className="text-[11px] text-muted-foreground">
                        /{Number(item.maxScore).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-green-600 dark:text-green-400">Dinilai</span>
                </div>
              ) : isPending ? (
                <div className="flex flex-col items-end gap-0.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">Dikumpulkan</span>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-0.5">
                  <AlertCircle className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground">Belum</span>
                </div>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function AssignmentList({ items }: { items: AssignmentListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <ClipboardList className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Belum ada tugas</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tugas akan muncul di sini setelah asisten menerbitkannya.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item, i) => (
        <AssignmentCard key={item.assignmentId} item={item} index={i} />
      ))}
    </motion.div>
  );
}
