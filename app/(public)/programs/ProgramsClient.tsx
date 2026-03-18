"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Network,
  Code2,
  Cpu,
  Cloud,
  Search,
  BookOpen,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "praktikum" | "study_group";

interface ProgramItem {
  id: string;
  title: string;
  description: string | null;
}

function getProgramIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("jaringan") || t.includes("network")) return Network;
  if (t.includes("web") || t.includes("cloud")) return Cloud;
  if (t.includes("mobile") || t.includes("software")) return Code2;
  return Cpu;
}

function inferType(title: string, description: string | null): string {
  const t = `${title} ${description ?? ""}`.toLowerCase();
  return t.includes("study") || t.includes("study_group") ? "study_group" : "praktikum";
}

function ProgramCard({ program, index }: { program: ProgramItem; index: number }) {
  const Icon = getProgramIcon(program.title);
  const type = inferType(program.title, program.description);
  const isPraktikum = type === "praktikum";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30">
        <div
          className={cn(
            "flex items-start justify-between p-5 pb-4",
            isPraktikum ? "bg-primary/5" : "bg-blue-500/5",
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isPraktikum
                ? "bg-primary/15 text-primary"
                : "bg-blue-500/15 text-blue-400",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              isPraktikum
                ? "bg-primary/10 text-primary"
                : "bg-blue-500/10 text-blue-400",
            )}
          >
            {isPraktikum ? "Practicum" : "Study Group"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-sm font-semibold text-foreground">{program.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {program.description ?? "—"}
          </p>
        </div>

        <div className="border-t border-border px-5 py-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Enroll now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Practicum", value: "praktikum" },
  { label: "Study Group", value: "study_group" },
];

export default function ProgramsClient({ programs }: { programs: ProgramItem[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = programs.filter((p) => {
    const type = inferType(p.title, p.description);
    if (activeFilter !== "all" && type !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const praktikumCount = programs.filter((p) => inferType(p.title, p.description) === "praktikum").length;
  const studyGroupCount = programs.filter((p) => inferType(p.title, p.description) === "study_group").length;

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Our Programs
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Practicum &amp; Study Groups
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Choose a program that fits your interests and goals. From required
            practicums to open study groups for everyone.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Register <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: "Total Programs", value: programs.length, icon: LayoutGrid },
              { label: "Practicum", value: praktikumCount, icon: BookOpen },
              { label: "Study Group", value: studyGroupCount, icon: Network },
              { label: "Open", value: programs.length, icon: ArrowRight },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter + Grid */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl border border-border bg-card p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                  activeFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none sm:w-64"
            />
          </div>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">
          {filtered.length} program{filtered.length !== 1 ? "s" : ""} found
        </p>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center"
            >
              <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">No programs found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term."
                  : "No programs available in this category yet."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((p, i) => (
                <ProgramCard key={p.id} program={p} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card px-8 py-8 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold text-foreground">Ready to join?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Register for free and start learning today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Register <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
