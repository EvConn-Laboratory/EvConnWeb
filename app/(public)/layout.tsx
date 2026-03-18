import { Navbar } from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-14">{children}</main>
      <Footer />
    </div>
  );
}
