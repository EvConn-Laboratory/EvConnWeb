import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LmsSidebar } from "@/components/navigation/LmsSidebar";

export default async function LmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LmsSidebar role={session.user.role} userName={session.user.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
