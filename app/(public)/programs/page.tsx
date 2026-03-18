import type { Metadata } from "next";
import { getPublishedProgramsAction } from "@/lib/actions/cms";
import ProgramsClient from "./ProgramsClient";

export const metadata: Metadata = { title: "Programs" };
export const revalidate = 300;

export default async function ProgramsPage() {
  const rawPrograms = await getPublishedProgramsAction();
  const programs = rawPrograms.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
  }));
  return <ProgramsClient programs={programs} />;
}
