"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useDashboardSidebar } from "./DashboardSidebarProvider";

export function DashboardMobileHeader() {
  const { toggle, isOpen } = useDashboardSidebar();
  const pathname = usePathname();
  const isLms = pathname.startsWith("/lms");
  const dashboardLink = isLms ? "/lms/dashboard" : "/admin/dashboard";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden sticky top-0 z-40">
      <Link href={dashboardLink} className="flex items-center gap-2">
        <Image src="/evconn-light.png" alt="EvConn Laboratory" width={24} height={24} className="rounded-sm shrink-0" />
        <span className="text-sm font-semibold text-foreground">
          EvConn <span className="text-primary">Lab</span>
        </span>
      </Link>

      <button
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </header>
  );
}
