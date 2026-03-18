"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

const SPANS: Array<"tall" | "wide" | "normal"> = ["normal", "tall", "normal", "wide"];

export interface GalleryItem {
  id: string;
  title?: string | null;
  description?: string | null;
  filePath: string;
  sortOrder: number;
  span?: "tall" | "wide" | "normal";
}

function Lightbox({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[currentIndex];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex max-h-[85vh] max-w-5xl flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {item.filePath ? (
          <img
            src={item.filePath}
            alt={item.title ?? ""}
            className="max-h-[75vh] max-w-full rounded-xl object-contain"
          />
        ) : (
          <div className="flex h-64 w-96 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ImageIcon className="h-12 w-12 text-white/20" />
          </div>
        )}
        {(item.title || item.description) && (
          <div className="text-center">
            {item.title && (
              <p className="text-sm font-medium text-white">{item.title}</p>
            )}
            {item.description && (
              <p className="mt-1 text-xs text-white/60">{item.description}</p>
            )}
          </div>
        )}
        <p className="text-xs text-white/40">
          {currentIndex + 1} / {items.length}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function GalleryClient({ items: rawItems }: { items: GalleryItem[] }) {
  const items = rawItems.map((item, index) => ({
    ...item,
    span: item.span ?? SPANS[index % SPANS.length],
  }));

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const prev = () =>
    setLightboxIndex((i) =>
      i === null ? null : i === 0 ? items.length - 1 : i - 1,
    );
  const next = () =>
    setLightboxIndex((i) =>
      i === null ? null : i === items.length - 1 ? 0 : i + 1,
    );

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center">
            <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No photos yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Gallery photos will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                onClick={() => setLightboxIndex(i)}
                className={[
                  "group relative overflow-hidden rounded-xl border border-border bg-card",
                  item.span === "tall" ? "row-span-2" : "",
                  item.span === "wide" ? "col-span-2" : "",
                ].join(" ")}
                aria-label={item.title ?? "Gallery image"}
              >
                {item.filePath ? (
                  <img
                    src={item.filePath}
                    alt={item.title ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  {item.title && (
                    <p className="text-sm font-semibold text-white line-clamp-1">
                      {item.title}
                    </p>
                  )}
                  <ZoomIn className="absolute right-3 top-3 h-5 w-5 text-white/80" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            items={items}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </>
  );
}
