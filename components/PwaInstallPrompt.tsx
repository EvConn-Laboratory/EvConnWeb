"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/animations/variants";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("evconn-pwa-dismissed")
    ) {
      return;
    }

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("evconn-pwa-dismissed", "1");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
          role="banner"
          aria-label="Install EvConn Lab App"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-teal-600 p-4 shadow-2xl shadow-teal-900/30">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Download className="h-5 w-5 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">
                Install EvConn Lab App
              </p>
              <p className="mt-0.5 text-xs text-teal-100 leading-tight">
                Akses lebih cepat dari home screen
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 bg-white px-3 text-xs font-semibold text-teal-700 hover:bg-teal-50 focus-visible:ring-white"
              >
                Install
              </Button>
              <button
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full text-teal-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Tutup banner install"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
