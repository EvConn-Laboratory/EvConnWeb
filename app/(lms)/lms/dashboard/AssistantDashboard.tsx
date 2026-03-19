"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  ClipboardList,
  Star,
  ChevronRight,
  ArrowRight,
  FileText,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/animations/variants";

type AssistantOfferingData = {
  offeringId: string;
  courseName: string;
  courseCode: string;
  semester: string;
  hari: string | null;
  shift: string | null;
  status: string;
  isLead: boolean;
  studentCount: number;
  groupCount: number;
  pendingGrades: number;
};

type FeedbackStat = {
  module: string;
  assistantAvg: number;
  sessionAvg: number;
  labAvg: number;
  responseCount: number;
};

interface AssistantDashboardProps {
  userName: string;
  role: "assistant" | "super_admin";
  offeringsCount: number;
  totalStudentsCount: number;
  pendingGradingCount: number;
  offerings: AssistantOfferingData[];
  gradingQueue: {
    studentName: string;
    assignment: string;
    module: string;
    submittedAt: string;
    type: "essay_pdf" | "mcq";
  }[];
  feedbackStats: FeedbackStat[];
  avgFeedbackRating: string | number;
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  color,
  href,
  urgent,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
  color: string;
  href?: string;
  urgent?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors",
        urgent && Number(value) > 0
          ? "border-amber-500/30 hover:border-amber-500/50"
          : "border-border hover:border-primary/30",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / 5) * 100);
  const color =
    value >= 4.5
      ? "bg-green-500"
      : value >= 3.5
        ? "bg-primary"
        : value >= 2.5
          ? "bg-amber-500"
          : "bg-destructive";

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function AssistantDashboard({
  userName,
  role,
  offeringsCount,
  totalStudentsCount,
  pendingGradingCount,
  offerings,
  gradingQueue,
  feedbackStats,
  avgFeedbackRating,
}: AssistantDashboardProps) {
  const firstName = userName.split(" ")[0];

  const chartData = feedbackStats.map((s) => ({
    name:
      s.module.length > 12 ? s.module.slice(0, 12) + "…" : s.module,
    Assistant: Number(s.assistantAvg.toFixed(2)),
    Session: Number(s.sessionAvg.toFixed(2)),
    Lab: Number(s.labAvg.toFixed(2)),
  }));

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Hello, {firstName}{" "}
          {role === "super_admin" && (
            <span className="ml-1 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary uppercase">
              Admin
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Summary of your teaching activities.
        </p>
        </div>
        {pendingGradingCount > 0 && (
          <Link
            href="/lms/grading"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/12"
          >
            <Star className="h-4 w-4" />
            {pendingGradingCount} needs grading
          </Link>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={BookOpen}
          value={offeringsCount}
          label="Offerings"
          sub="Assigned"
          color="bg-primary/10 text-primary"
          href="/lms/offerings"
        />
        <StatCard
          icon={Users}
          value={totalStudentsCount}
          label="Students"
          sub="Total enrolled"
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={ClipboardList}
          value={pendingGradingCount}
          label="Needs Grading"
          sub="Essay submissions"
          color="bg-amber-500/10 text-amber-400"
          href="/lms/grading"
          urgent
        />
        <StatCard
          icon={Star}
          value={
            typeof avgFeedbackRating === "number"
              ? (avgFeedbackRating as number).toFixed(1)
              : avgFeedbackRating
          }
          label="Avg Rating"
          sub="Student feedback"
          color="bg-green-500/10 text-green-400"
        />
      </motion.div>


      <div className="grid gap-6 lg:grid-cols-3">
        {/* Offerings */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              My Offerings
            </h2>
            <Link
              href="/lms/offerings"
              className="text-xs font-medium text-primary hover:underline"
            >
              All →
            </Link>
          </div>
          {offerings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No offerings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {offerings.slice(0, 4).map((off) => (
                <Link
                  key={off.offeringId}
                  href={`/lms/offerings/${off.offeringId}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">
                        {off.courseCode}
                      </span>
                      {off.isLead && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Lead
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          off.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {off.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {off.courseName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        off.semester,
                        off.hari,
                        off.shift && `Shift ${off.shift}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                      <p className="font-bold text-foreground tabular-nums">
                        {off.studentCount}
                      </p>
                      <p>Students</p>
                    </div>
                    {off.pendingGrades > 0 && (
                      <div className="text-center text-amber-400">
                        <p className="font-bold tabular-nums">
                          {off.pendingGrades}
                        </p>
                        <p>Pending</p>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Grading queue */}
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Grading Queue
            </h2>
            <Link
              href="/lms/grading"
              className="text-xs font-medium text-primary hover:underline"
            >
              Open →
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {gradingQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No pending submissions.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {gradingQueue.slice(0, 5).map((item, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item.studentName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.assignment}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {item.module}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          item.type === "essay_pdf"
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-blue-500/10 text-blue-400",
                        )}
                      >
                        {item.type === "essay_pdf" ? "Essay" : "MCQ"}
                      </span>
                    </div>
                  </div>
                ))}
                {gradingQueue.length > 5 && (
                  <Link
                    href="/lms/grading"
                    className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-primary hover:bg-muted/30 transition-colors"
                  >
                    +{gradingQueue.length - 5} more{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Feedback analytics */}
      {feedbackStats.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Feedback Analytics
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-xs font-medium text-muted-foreground">
                Rating Trend per Module
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7E95" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#6B7E95" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="Assistant"
                    stroke="#2ABFBF"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Session"
                    stroke="#3B82C4"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Lab"
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-module stats */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-xs font-medium text-muted-foreground">
                Breakdown per Module
              </p>
              <div className="space-y-4 overflow-y-auto max-h-[200px]">
                {feedbackStats.map((stat) => (
                  <div key={stat.module}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="truncate text-xs font-medium text-foreground">
                        {stat.module}
                      </p>
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                        {stat.responseCount} responses
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <RatingBar label="Assistant" value={stat.assistantAvg} />
                      <RatingBar label="Session" value={stat.sessionAvg} />
                      <RatingBar label="Lab" value={stat.labAvg} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/lms/groups", icon: Users, label: "Manage Groups" },
            {
              href: "/lms/submissions",
              icon: FileText,
              label: "Submissions",
            },
            {
              href: "/lms/grading",
              icon: Star,
              label: "Grading Queue",
            },
            {
              href: "/lms/offerings",
              icon: BarChart2,
              label: "My Offerings",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-primary" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
