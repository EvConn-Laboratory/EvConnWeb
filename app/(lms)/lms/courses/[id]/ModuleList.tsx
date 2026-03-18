"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  ChevronRight,
  Calendar,
  AlarmClock,
} from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations/variants";
import { cn } from "@/lib/utils";

type ModuleStatus = "draft" | "scheduled" | "open" | "closed";

interface ModuleRow {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: ModuleStatus;
  openDatetime: string | null;
  closeDatetime: string | null;
  isComplete: boolean;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  const config: Record<
    ModuleStatus,
    { label: string; className: string }
  > = {
    draft: {
      label: "Draft",
      className: "bg-muted text-muted-foreground",
    },
    scheduled: {
      label: "Terjadwal",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    open: {
      label: "Dibuka",
      className: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    closed: {
      label: "Ditutup",
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
  };
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

function ModuleRow({
  mod,
  index,
  offeringId,
}: {
  mod: ModuleRow;
  index: number;
  offeringId: string;
}) {
  const isAccessible = mod.status === "open";
  const isLocked = mod.status === "draft";

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Link
        href={isAccessible || mod.status === "closed" ? `/lms/modules/${mod.id}` : "#"}
        className={cn(
          "group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors",
          isLocked
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-muted/30 cursor-pointer",
        )}
        onClick={isLocked ? (e) => e.preventDefault() : undefined}
      >
        {/* Module number / completion */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            mod.isComplete
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : isAccessible
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
          )}
        >
          {mod.isComplete ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <span>{mod.orderIndex + 1}</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {mod.title}
            </p>
            <StatusBadge status={mod.status} />
          </div>
          {mod.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {mod.description}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {mod.openDatetime && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Buka: {formatDate(mod.openDatetime)}
              </span>
            )}
            {mod.closeDatetime && (
              <span className="flex items-center gap-1">
                <AlarmClock className="h-3 w-3" />
                Tutup: {formatDate(mod.closeDatetime)}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        {!isLocked && (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </Link>
    </motion.div>
  );
}

export function ModuleList({
  modules,
  offeringId,
}: {
  modules: ModuleRow[];
  offeringId: string;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-2"
    >
      {modules.map((mod, i) => (
        <ModuleRow key={mod.id} mod={mod} index={i} offeringId={offeringId} />
      ))}
    </motion.div>
  );
}
