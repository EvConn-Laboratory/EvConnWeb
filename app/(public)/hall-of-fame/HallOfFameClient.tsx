"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Github, Instagram, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Generation, AssistantProfile } from "@/lib/db/schema";

type AssistantWithRoles = AssistantProfile & {
  roles: Array<{ roleId: string; roleName: string; sortOrder: number }>;
};
type GenerationWithMembers = {
  generation: Generation;
  members: AssistantWithRoles[];
};

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function HexAvatar({
  src,
  name,
  initials: providedInitials,
  isAlumni,
}: {
  src?: string | null;
  name: string;
  initials?: string | null;
  isAlumni: boolean;
}) {
  const computedInitials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const initials = providedInitials || computedInitials;

  return (
    <div className="relative">
      <div
        className="h-14 w-14 overflow-hidden bg-primary/15 text-primary"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold">
            {initials}
          </div>
        )}
      </div>
      {!isAlumni && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-400" />
      )}
    </div>
  );
}

function AssistantCard({
  member,
  index,
}: {
  member: AssistantWithRoles;
  index: number;
}) {
  const isAlumni = member.status === "alumni";
  const primaryRole = member.roles[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start gap-4">
        <HexAvatar
          src={member.profilePhotoPath}
          name={member.fullName}
          initials={member.initials}
          isAlumni={isAlumni}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {member.fullName}
            </p>
            {member.initials && (
              <span className="shrink-0 rounded bg-primary/10 px-1 py-0.5 text-[10px] font-bold text-primary">
                {member.initials}
              </span>
            )}
          </div>
          {primaryRole && (
            <p className="mt-0.5 text-xs text-primary">{primaryRole.roleName}</p>
          )}
          {member.roles.slice(1).map((r) => (
            <p key={r.roleId} className="mt-0.5 text-xs text-muted-foreground">
              {r.roleName}
            </p>
          ))}
          {isAlumni && (
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              Alumni
            </span>
          )}
        </div>
      </div>

      {/* Social */}
      <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {member.githubUrl && (
          <a
            href={member.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <GithubIcon className="h-3.5 w-3.5" />
          </a>
        )}
        {member.instagramUrl && (
          <a
            href={member.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-pink-500/40 hover:text-pink-400"
          >
            <InstagramIcon className="h-3.5 w-3.5" />
          </a>
        )}
        {member.linkedinUrl && (
          <a
            href={member.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-blue-500/40 hover:text-blue-400"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function HallOfFameClient({
  data,
}: {
  data: GenerationWithMembers[];
}) {
  const activeGen = data.find((g) => g.generation.isActive) ?? data[0];
  const [activeGenId, setActiveGenId] = useState<string>(
    activeGen?.generation.id ?? "",
  );

  const activeData = data.find((g) => g.generation.id === activeGenId);

  return (
    <div>
      {/* Generation tabs */}
      <div className="sticky top-14 z-20 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {data.map((g) => (
              <button
                key={g.generation.id}
                onClick={() => setActiveGenId(g.generation.id)}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeGenId === g.generation.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {g.generation.name}
                {g.generation.isActive && (
                  <span className="ml-2 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
                    Aktif
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <AnimatePresence mode="wait">
          {!activeData || activeData.members.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center"
            >
              <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">
                Belum ada anggota
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Anggota akan ditampilkan di sini setelah ditambahkan.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeGenId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Gen info */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {activeData.generation.name}
                  </h2>
                  {activeData.generation.startYear && (
                    <p className="text-sm text-muted-foreground">
                      Tahun {activeData.generation.startYear}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {activeData.members.length} anggota
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {activeData.members.map((member, i) => (
                  <AssistantCard key={member.id} member={member} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
