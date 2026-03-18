"use client";

import dynamic from "next/dynamic";

const ParticleMesh = dynamic(
  () => import("@/components/ParticleMesh").then((m) => m.ParticleMesh),
  { ssr: false, loading: () => <div className="fixed inset-0 z-0 bg-background" /> },
);

export function ParticleMeshClient() {
  return <ParticleMesh />;
}
