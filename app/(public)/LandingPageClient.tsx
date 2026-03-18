"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  GraduationCap,
  BookOpen,
  Trophy,
  Users,
  Network,
  Code2,
  Cpu,
  Cloud,
  Database,
  Layers,
  Terminal,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkBackground } from "@/components/NetworkBackground";
import AssistantsSectionClient from "./_components/AssistantsSectionClient";
import type { Generation, AssistantProfile } from "@/lib/db/schema";

const STAT_ICONS = { GraduationCap, BookOpen, Trophy, Users } as const;

type LandingStat = {
  value: string;
  label: string;
  icon: keyof typeof STAT_ICONS;
};

type LandingProgram = {
  id: string;
  title: string;
  description: string | null;
  thumbnailPath: string | null;
};

type LandingNews = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
};

type AssistantWithRoles = AssistantProfile & {
  roles: Array<{ roleId: string; roleName: string; sortOrder: number }>;
};
type GenerationWithMembers = {
  generation: Generation;
  members: AssistantWithRoles[];
};

const PROGRAM_PALETTE = [
  { icon: Network,  accent: "text-cyan-600 dark:text-cyan-400",    bg: "bg-cyan-50 dark:bg-cyan-500/10" },
  { icon: Cloud,    accent: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10" },
  { icon: Code2,    accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { icon: Cpu,      accent: "text-orange-500 dark:text-amber-400", bg: "bg-orange-50 dark:bg-amber-500/10" },
  { icon: Database, accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
  { icon: Layers,   accent: "text-pink-600 dark:text-pink-400",    bg: "bg-pink-50 dark:bg-pink-500/10" },
  { icon: Terminal, accent: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-50 dark:bg-teal-500/10" },
] as const;

function programCode(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 6).toUpperCase();
  return words.map((w) => w[0]).join("").toUpperCase();
}



function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
      <Zap className="h-3 w-3" />
      {children}
    </p>
  );
}

export default function LandingPageClient({
  stats,
  programs,
  news,
  hallOfFame,
}: {
  stats: LandingStat[];
  programs: LandingProgram[];
  news: LandingNews[];
  hallOfFame: GenerationWithMembers[];
}) {
  return (
    <div className="bg-background">
      {/* ── HERO ── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center lg:px-8">
        {/* Animated network background — fills the entire hero */}
        <div className="absolute inset-0 z-0">
          <NetworkBackground className="h-full w-full opacity-55 dark:opacity-40" />
        </div>

        {/* Very subtle gradient overlay so text stays readable */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/60 via-background/30 to-background/80" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Integrated Laboratory Platform
          </span>

          <h1
            className="text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            One Platform for{" "}
            <span className="text-primary">All Lab Activities</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            EvConn Lab unifies practicum sessions, study groups, grading, and
            assistant management in one efficient digital ecosystem.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-lg"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-background"
            >
              View Programs
            </Link>
          </div>
        </motion.div>

      </section>

      {/* ── STATS STRIP ── */}
      <FadeIn>
        <div className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => {
                const Icon = STAT_ICONS[stat.icon];
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center bg-primary/10 text-primary"
                      style={{
                        clipPath:
                          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── PROGRAMS ── */}
      <FadeIn>
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12">
              <SectionLabel>Practicum &amp; Study Groups</SectionLabel>
              <h2
                className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              >
                Master Computer Engineering
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Choose a program that fits your interests and goals. From
                required practicums to open study groups for everyone.
              </p>
            </div>

            {programs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No programs published yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {programs.map((prog, i) => {
                  const palette = PROGRAM_PALETTE[i % PROGRAM_PALETTE.length];
                  const Icon = palette.icon;
                  return (
                    <motion.div
                      key={prog.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="h-full"
                    >
                      <Link
                        href="/programs"
                        className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", palette.bg)}>
                            <Icon className={cn("h-5 w-5", palette.accent)} />
                          </div>
                          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {programCode(prog.title)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            {prog.title}
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-4">
                            {prog.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="mt-10 text-center">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View all programs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>


      {/* ── NEWS ── */}
      <FadeIn>
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div>
                <SectionLabel>From the Lab</SectionLabel>
                <h2
                  className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                >
                  Latest News
                </h2>
              </div>
              <Link
                href="/news"
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                All news →
              </Link>
            </div>

            {news.length === 0 ? (
              <p className="text-sm text-muted-foreground">No news published yet.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-3">
                {news.map((article, i) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      href={`/news/${article.slug}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          News
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {article.date}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground transition-colors line-clamp-2 group-hover:text-primary">
                        {article.title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                      <span className="mt-auto text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Read more →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeIn>

      {/* ── ASSISTANTS ── */}
      <FadeIn>
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div>
                <SectionLabel>Our Team</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Meet the Assistants
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Dedicated lab assistants guiding students through every generation.
                </p>
              </div>
              <Link
                href="/hall-of-fame"
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Hall of Fame →
              </Link>
            </div>
            <AssistantsSectionClient data={hallOfFame} />
          </div>
        </section>
      </FadeIn>

      {/* ── CTA ── */}
      <FadeIn>
        <section className="relative overflow-hidden border-t border-border bg-card py-24">
          {/* Subtle background network for CTA section */}
          <div className="absolute inset-0 z-0 opacity-20 dark:opacity-15">
            <NetworkBackground className="h-full w-full" />
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-card via-card/60 to-card/20" />

          <div className="relative z-10 mx-auto max-w-2xl px-6 text-center lg:px-8">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center bg-primary/10 text-primary"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Ready to Join?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Register now and start your learning journey alongside thousands
              of Computer Engineering students.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                Register Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                View Programs
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
