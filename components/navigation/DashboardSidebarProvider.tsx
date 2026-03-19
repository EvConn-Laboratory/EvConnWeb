"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function DashboardSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggle = () => setIsOpen((prev) => !prev);

  // Close sidebar on path change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useDashboardSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useDashboardSidebar must be used within a DashboardSidebarProvider");
  }
  return context;
}
