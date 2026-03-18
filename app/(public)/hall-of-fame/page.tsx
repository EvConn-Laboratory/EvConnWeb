import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { getHallOfFameAction } from "@/lib/actions/personnel";
import HallOfFameClient from "./HallOfFameClient";

export const metadata: Metadata = { title: "Hall of Fame" };
export const revalidate = 300;

export default async function HallOfFamePage() {
  const data = await getHallOfFameAction();
  const totalMembers = data.reduce((acc, g) => acc + g.members.length, 0);

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Sejarah Kami
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Hall of Fame
              </h1>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Rekam jejak para asisten laboratorium EvConn dari setiap
                generasi yang telah berkontribusi.
              </p>
            </div>
            <div className="shrink-0 hidden sm:flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {data.length}
                </p>
                <p className="text-xs text-muted-foreground">Generasi</p>
              </div>
              <div className="ml-4 border-l border-border pl-4">
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {totalMembers}
                </p>
                <p className="text-xs text-muted-foreground">Asisten</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HallOfFameClient data={data} />
    </div>
  );
}
