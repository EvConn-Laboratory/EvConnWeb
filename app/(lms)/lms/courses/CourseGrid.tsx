"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/animations/variants";

type OfferingItem = {
  offering: {
    id: string;
    semester: string;
    academicYear: string | null;
    hari: string | null;
    shift: string | null;
  };
  course: {
    name: string;
    code: string;
    type: "praktikum" | "study_group";
  };
  modulesTotal: number;
  modulesComplete: number;
};

function CourseCard({
  item,
  index,
}: {
  item: OfferingItem;
  index: number;
}) {
  const { offering, course, modulesTotal, modulesComplete } = item;
  const progress =
    modulesTotal > 0 ? Math.round((modulesComplete / modulesTotal) * 100) : 0;
  const isPraktikum = course.type !== "study_group";

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Link
        href={`/lms/courses/${offering.id}`}
        className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              isPraktikum
                ? "bg-primary/10 text-primary"
                : "bg-blue-500/10 text-blue-400",
            )}
          >
            {isPraktikum ? "Praktikum" : "Study Group"}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {course.name}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {course.code}
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          {[
            offering.semester,
            offering.academicYear,
            offering.hari,
            offering.shift && `Shift ${offering.shift}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">
              {modulesComplete}/{modulesTotal}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.05 }}
            />
          </div>
        </div>

        <span className="mt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Lihat Modul →
        </span>
      </Link>
    </motion.div>
  );
}

export default function CourseGrid({ offerings }: { offerings: OfferingItem[] }) {
  if (offerings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <BookOpen className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-foreground">Belum ada mata kuliah</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Hubungi asisten untuk mendaftarkan Anda ke mata kuliah.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {offerings.map((item, i) => (
        <CourseCard key={item.offering.id} item={item} index={i} />
      ))}
    </motion.div>
  );
}
