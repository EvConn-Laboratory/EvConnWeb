"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "News", href: "/news" },
  { label: "Gallery", href: "/gallery" },
  { label: "Hall of Fame", href: "/hall-of-fame" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/evconn-light.png" alt="EvConn Laboratory" width={28} height={28} className="rounded-sm" />
      <span className="text-sm font-semibold tracking-tight text-foreground">
        EvConn <span className="text-primary">Lab</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm shadow-black/5 backdrop-blur-md dark:shadow-black/20"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden border-b border-border bg-background lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-0.5 px-6 py-3">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              ))}
              <div className="flex gap-2 border-t border-border pt-3">
                <Link
                  href="/login"
                  className="flex-1 rounded-lg border border-border py-2 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
