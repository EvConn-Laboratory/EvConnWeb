import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";

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
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
