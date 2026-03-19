import Link from "next/link";
import type { Metadata } from "next";
import { Bell, BellOff, CheckCheck, Star, ClipboardList, BookOpen, Megaphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyNotificationsAction, markAllNotificationsReadAction } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  grade_published: { icon: Star, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  submission_received: { icon: ClipboardList, color: "bg-blue-500/10 text-blue-500" },
  assignment_due: { icon: AlertCircle, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  module_opened: { icon: BookOpen, color: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  module_closed: { icon: BookOpen, color: "bg-muted text-muted-foreground" },
  announcement: { icon: Megaphone, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export default async function NotificationsPage() {
  const notifs = await getMyNotificationsAction();
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your latest activity notification center.
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button variant="outline" size="sm" className="gap-1.5" type="submit">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {notifs.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BellOff className="h-8 w-8" />
          </div>
          <p className="text-base font-semibold text-foreground">
            No notifications yet
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Notifications about assignments, grades, and important announcements
            will appear here.
          </p>
          <div className="mt-6">
            <Button variant="outline" size="sm" className="rounded-lg gap-1.5" asChild>
              <Link href="/lms/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      ) : (
        /* Notification list */
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {notifs.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.announcement;
            const Icon = cfg.icon;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/20",
                  !notif.isRead && "bg-primary/3",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    cfg.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        notif.isRead
                          ? "font-normal text-foreground"
                          : "font-semibold text-foreground",
                      )}
                    >
                      {notif.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="mt-1.5 inline-flex items-center text-[11px] font-medium text-primary hover:underline underline-offset-4"
                    >
                      See more details →
                    </Link>
                  )}
                </div>

                {!notif.isRead && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
