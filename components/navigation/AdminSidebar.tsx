"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileUp,
  Award,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Trophy,
  FileText,
  Image,
  Newspaper,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  {
    label: "Hall of Fame",
    href: "/admin/hall-of-fame",
    icon: Trophy,
    children: [
      { label: "Generations", href: "/admin/hall-of-fame/generations" },
      { label: "Assistants", href: "/admin/hall-of-fame/assistants" },
      { label: "Roles", href: "/admin/hall-of-fame/roles" },
    ],
  },
  {
    label: "CMS",
    href: "/admin/cms",
    icon: FileText,
    children: [
      { label: "Programs", href: "/admin/cms/programs" },
      { label: "News", href: "/admin/cms/news" },
      { label: "Gallery", href: "/admin/cms/gallery" },
      { label: "Pages", href: "/admin/cms/pages" },
    ],
  },
  { label: "Certificates", href: "/admin/certificates", icon: Award },
  { label: "CSV Import", href: "/admin/import", icon: FileUp },
];

function NavGroup({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-primary"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-primary"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="ml-4 mt-0.5 space-y-0.5 overflow-hidden border-l border-border pl-3"
          >
            {item.children!.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-sm transition-colors",
                    childActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        >
          <span className="text-[9px] font-bold text-primary-foreground">
            EC
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            EvConn <span className="text-primary">Lab</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-2.5 w-2.5" />
            Admin Panel
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavGroup key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
