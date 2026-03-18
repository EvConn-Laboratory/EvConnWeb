import type { Metadata } from "next";
import Link from "next/link";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | EvConn Laboratory",
  },
};

function HexLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 2 L30 9.5 L30 22.5 L16 30 L2 22.5 L2 9.5 Z"
        fill="var(--evconn-teal)"
      />
      <path
        d="M16 9 L23 13 L23 21 L16 25 L9 21 L9 13 Z"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Network background — very subtle */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-25">
        <NetworkBackground className="h-full w-full" />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-75"
      >
        <HexLogo />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          EvConn <span className="text-primary">Lab</span>
        </span>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-border bg-background/95 px-8 py-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/30">
        {children}
      </div>

      {/* Footer note */}
      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} EvConn Laboratory &mdash; All rights
        reserved.
      </p>
    </div>
  );
}
