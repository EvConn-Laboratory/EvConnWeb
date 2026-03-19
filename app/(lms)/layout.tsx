import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LmsSidebar } from "@/components/navigation/LmsSidebar";
import { DashboardSidebarProvider } from "@/components/navigation/DashboardSidebarProvider";
import { DashboardMobileHeader } from "@/components/navigation/DashboardMobileHeader";

export default async function LmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardSidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <LmsSidebar role={session.user.role} userName={session.user.name} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <DashboardMobileHeader />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </div>
        </main>
      </div>
    </DashboardSidebarProvider>
  );
}
