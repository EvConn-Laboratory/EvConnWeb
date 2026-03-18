"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  Star,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/animations/variants";

type EnrolledCourse = {
  id: string;
  name: string;
  code: string;
  hari: string | null;
  shift: string | null;
  semester: string;
  type: string;
  modulesTotal: number;
  modulesComplete: number;
};

type RecentModule = {
  id: string;
  title: string;
  orderIndex: number;
  isComplete: boolean;
  offeringId: string;
};

interface StudentDashboardProps {
  userName: string;
  courses: EnrolledCourse[];
  completedModulesCount: number;
  totalModulesCount: number;
  submittedAssignmentsCount: number;
  totalAssignmentsCount: number;
  gradedCount: number;
  recentModules: RecentModule[];
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  color,
  href,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function CourseCard({ course, index }: { course: EnrolledCourse; index: number }) {
  const progress =
    course.modulesTotal > 0
      ? Math.round((course.modulesComplete / course.modulesTotal) * 100)
      : 0;
  const isPraktikum = course.type !== "study_group";

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Link
        href={`/lms/courses/${course.id}`}
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
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {course.name}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {course.code}
        </p>

        {(course.hari || course.semester) && (
          <p className="mt-2 text-xs text-muted-foreground">
            {[course.semester, course.hari, course.shift && `Shift ${course.shift}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">
              {course.modulesComplete}/{course.modulesTotal} modul
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function StudentDashboard({
  userName,
  courses,
  completedModulesCount,
  totalModulesCount,
  submittedAssignmentsCount,
  totalAssignmentsCount,
  gradedCount,
  recentModules,
}: StudentDashboardProps) {
  const firstName = userName.split(" ")[0];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Halo, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Berikut ringkasan progres belajarmu.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={BookOpen}
          value={courses.length}
          label="Mata Kuliah"
          sub="Aktif semester ini"
          color="bg-primary/10 text-primary"
          href="/lms/courses"
        />
        <StatCard
          icon={CheckSquare}
          value={`${completedModulesCount}/${totalModulesCount}`}
          label="Modul Selesai"
          sub="Dari semua mata kuliah"
          color="bg-green-500/10 text-green-400"
        />
        <StatCard
          icon={ClipboardList}
          value={`${submittedAssignmentsCount}/${totalAssignmentsCount}`}
          label="Tugas Dikumpul"
          sub="Semua mata kuliah"
          color="bg-blue-500/10 text-blue-400"
          href="/lms/assignments"
        />
        <StatCard
          icon={Star}
          value={gradedCount}
          label="Nilai Diterima"
          sub="Tugas yang sudah dinilai"
          color="bg-amber-500/10 text-amber-400"
          href="/lms/grades"
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Courses */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Mata Kuliah Aktif
            </h2>
            <Link
              href="/lms/courses"
              className="text-xs font-medium text-primary hover:underline"
            >
              Semua →
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">
                Belum ada mata kuliah
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hubungi asisten untuk mendaftar.
              </p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              className="grid gap-4 sm:grid-cols-2"
            >
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent modules */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Modul Terkini
              </h2>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {recentModules.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Belum ada modul.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentModules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/lms/modules/${mod.id}`}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          Modul {mod.orderIndex} — {mod.title}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          mod.isComplete
                            ? "bg-green-500/10 text-green-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {mod.isComplete ? "Selesai" : "Belum"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Feedback reminder */}
          <motion.div
            variants={fadeUp}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              Berikan Feedback
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Penilaian Anda membantu meningkatkan kualitas praktikum.
            </p>
            <Link
              href="/lms/feedback"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Beri feedback <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
