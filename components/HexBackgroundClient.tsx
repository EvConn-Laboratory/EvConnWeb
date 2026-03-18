"use client";

import dynamic from "next/dynamic";

const HexBackground = dynamic(
  () => import("@/components/HexBackground").then((m) => m.HexBackground),
  { ssr: false, loading: () => <div className="fixed inset-0 z-0 bg-background" /> },
);

export function HexBackgroundClient() {
  return <HexBackground />;
}
