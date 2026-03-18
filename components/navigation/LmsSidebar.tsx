"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Star,
  Bell,
  UserCircle,
  CalendarCheck,
  Award,
  Users,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

type Role = "super_admin" | "assistant" | "student" | "guest";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/lms/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "assistant", "student", "guest"],
  },
  {
    label: "My Courses",
    href: "/lms/courses",
    icon: BookOpen,
    roles: ["student", "guest"],
  },
  {
    label: "Assignments",
    href: "/lms/assignments",
    icon: ClipboardList,
    roles: ["student"],
  },
  {
    label: "Grades",
    href: "/lms/grades",
    icon: Star,
    roles: ["student"],
  },
  {
    label: "Attendance",
    href: "/lms/attendance",
    icon: CalendarCheck,
    roles: ["student"],
  },
  {
    label: "Certificates",
    href: "/lms/certificates",
    icon: Award,
    roles: ["student"],
  },
  {
    label: "Feedback",
    href: "/lms/feedback",
    icon: GraduationCap,
    roles: ["student", "guest"],
  },
  {
    label: "My Offerings",
    href: "/lms/offerings",
    icon: GraduationCap,
    roles: ["assistant", "super_admin"],
  },
  {
    label: "Groups",
    href: "/lms/groups",
    icon: Users,
    roles: ["assistant", "super_admin"],
  },
  {
    label: "Submissions",
    href: "/lms/submissions",
    icon: ClipboardList,
    roles: ["assistant", "super_admin"],
  },
  {
    label: "Grading Queue",
    href: "/lms/grading",
    icon: Star,
    roles: ["assistant", "super_admin"],
  },
];

function HexIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center bg-primary",
        className,
      )}
      style={{
        clipPath:
          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
    >
      <span className="text-[10px] font-bold text-primary-foreground">EC</span>
    </div>
  );
}

interface LmsSidebarProps {
  role: Role;
  userName: string;
}

export function LmsSidebar({ role, userName }: LmsSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-3" : "justify-between px-4",
        )}
      >
        {!collapsed && (
          <Link href="/lms/dashboard" className="flex items-center gap-2">
            <HexIcon />
            <span className="text-sm font-semibold text-sidebar-foreground">
              EvConn <span className="text-primary">Lab</span>
            </span>
          </Link>
        )}
        {collapsed && <HexIcon />}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground",
            collapsed && "mt-0",
          )}
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItem === item.href;

          return (
            <div key={item.href}>
              {hasChildren ? (
                <button
                  onClick={() =>
                    setExpandedItem(isExpanded ? null : item.href)
                  }
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              )}

              {/* Sub-items */}
              <AnimatePresence>
                {hasChildren && isExpanded && !collapsed && (
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
                            "block rounded-md px-2 py-1.5 text-xs transition-colors",
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
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-0.5">
        <Link
          href="/lms/notifications"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Notifications" : undefined}
        >
          <Bell className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">Notifications</span>}
        </Link>

        <Link
          href="/lms/profile"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Profile" : undefined}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="truncate text-xs">{userName}</span>
          )}
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
