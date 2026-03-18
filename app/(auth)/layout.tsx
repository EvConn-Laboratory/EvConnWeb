import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | EvConn Laboratory",
  },
};


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
        <Image src="/evconn.png" alt="EvConn Laboratory" width={36} height={36} className="rounded-sm" />
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
