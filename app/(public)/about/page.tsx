import type { Metadata } from "next";
import Link from "next/link";
import {
  Target,
  Eye,
  Network,
  Code2,
  Users,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { getPublishedCmsPageBySlugAction } from "@/lib/actions/cms";

export const metadata: Metadata = { title: "About Us" };

const WHAT_WE_DO = [
  {
    icon: Network,
    title: "Network Research",
    description:
      "Developing student competency in computer networking, cybersecurity, and digital infrastructure.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Code2,
    title: "Software Development",
    description:
      "Driving software innovation through practicum sessions and real-world industry-based projects.",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Users,
    title: "Assistant Development",
    description:
      "Producing competent and dedicated lab assistants through rigorous selection and training.",
    color: "bg-green-500/10 text-green-400",
  },
  {
    icon: GraduationCap,
    title: "Quality Education",
    description:
      "Providing cutting-edge practicum curricula aligned with the demands of the technology industry.",
    color: "bg-amber-500/10 text-amber-400",
  },
];

export default async function AboutPage() {
  const cmsPage = await getPublishedCmsPageBySlugAction("about");

  if (cmsPage && cmsPage.content?.trim()) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {cmsPage.title}
        </h1>
        <article
          className="prose prose-invert mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: cmsPage.content }}
        />
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="border-b border-border py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            About Us
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            EvConn Laboratory
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            A Computer Engineering laboratory committed to cultivating top
            digital talent through practicum sessions, research, and human
            resource development.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="border-b border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Mission */}
            <div className="rounded-xl border border-border bg-background p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Mission</h2>
              <ul className="mt-4 space-y-3">
                {[
                  "Deliver high-quality, industry-relevant practicum programs.",
                  "Develop professional and dedicated laboratory assistants.",
                  "Build an inclusive and efficient digital learning ecosystem.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision */}
            <div className="rounded-xl border border-border bg-background p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Vision</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                To become a leading computer laboratory that produces future
                innovators and technology leaders through hands-on education
                and cutting-edge research.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What We Do */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              What We Do
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Our Focus &amp; Activities
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_DO.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">
            Join Us
          </h2>
          <p className="mt-3 text-muted-foreground">
            Become part of the EvConn Laboratory learning community and reach
            your full potential.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Register Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View Programs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
