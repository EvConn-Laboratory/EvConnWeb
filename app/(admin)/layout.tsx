import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { DashboardSidebarProvider } from "@/components/navigation/DashboardSidebarProvider";
import { DashboardMobileHeader } from "@/components/navigation/DashboardMobileHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    redirect("/lms/dashboard");
  }

  return (
    <DashboardSidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
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
