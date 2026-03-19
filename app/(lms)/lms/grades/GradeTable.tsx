"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GradeRow } from "./page";

const TYPE_LABEL: Record<string, string> = {
  tugas_rumah: "Homework",
  tugas_praktikum: "Practicum Task",
  study_group_task: "Study Group",
};

const TYPE_COLOR: Record<string, string> = {
  tugas_rumah: "bg-amber-500/10 text-amber-400",
  tugas_praktikum: "bg-primary/10 text-primary",
  study_group_task: "bg-violet-500/10 text-violet-400",
};

function StatusBadge({ row }: { row: GradeRow }) {
  if (row.score !== null && row.gradeStatus === "published") {
    return (
      <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
        Graded
      </span>
    );
  }
  if (row.submittedAt) {
    return (
      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
        Pending
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Not Submitted
    </span>
  );
}

export function GradeTable({
  rows,
  offeringId,
}: {
  rows: GradeRow[];
  offeringId: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No assignments for this course yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assignment
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Module
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row.assignmentId}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/lms/modules/${row.moduleId}`}
                    className="group flex flex-col gap-1"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {row.assignmentTitle}
                    </span>
                    <span
                      className={cn(
                        "w-fit rounded-full px-2 py-0.5 text-[10px] font-medium",
                        TYPE_COLOR[row.assignmentType] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {TYPE_LABEL[row.assignmentType] ?? row.assignmentType}
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/lms/modules/${row.moduleId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-2"
                  >
                    {row.moduleTitle}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge row={row} />
                </td>
                <td className="px-5 py-4 text-right">
                  {row.score !== null && row.gradeStatus === "published" ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {Number(row.score).toFixed(0)}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{Number(row.maxScore).toFixed(0)}
                        </span>
                      </span>
                      {row.gradeComment && (
                        <span
                          className="max-w-[180px] truncate text-[10px] text-muted-foreground"
                          title={row.gradeComment}
                        >
                          {row.gradeComment}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
