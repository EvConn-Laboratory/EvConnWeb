import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Mail, Instagram, ArrowLeft, ExternalLink } from "lucide-react";
import { getPublishedCmsPageBySlugAction } from "@/lib/actions/cms";

export const metadata: Metadata = { title: "Contact Us" };

const CONTACT_INFO = [
  {
    icon: MapPin,
    title: "Location",
    lines: ["Computer Engineering Building, 2nd Floor", "University — City, Province"],
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["lab@evconn.ac.id"],
    href: "mailto:lab@evconn.ac.id",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Instagram,
    title: "Instagram",
    lines: ["@evconn_lab"],
    href: "https://instagram.com",
    color: "bg-pink-500/10 text-pink-400",
  },
];

export default async function ContactPage() {
  const cmsPage = await getPublishedCmsPageBySlugAction("contact");

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
            Reach Out
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Have a question or want to collaborate? Don't hesitate to reach out
            through any of the channels below.
          </p>
        </div>
      </div>

      {/* Contact cards */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-3">
            {CONTACT_INFO.map((info) => {
              const Icon = info.icon;
              const inner = (
                <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${info.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {info.title}
                  </h3>
                  {info.lines.map((line) => (
                    <p
                      key={line}
                      className="mt-1 text-sm text-muted-foreground"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              );

              return info.href ? (
                <a
                  key={info.title}
                  href={info.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <div key={info.title}>{inner}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Email CTA */}
      <div className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Send Us a Message
          </h2>
          <p className="mt-3 text-muted-foreground">
            For academic inquiries, partnerships, or any other information,
            contact us via email.
          </p>
          <a
            href="mailto:lab@evconn.ac.id"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            lab@evconn.ac.id
          </a>
        </div>
      </div>

      {/* Social links */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Social Media
          </p>
          <h2 className="mb-8 text-2xl font-bold text-foreground">
            Follow Us
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Instagram",
                handle: "@evconn_lab",
                href: "https://instagram.com",
                color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
              },
              {
                label: "Email",
                handle: "lab@evconn.ac.id",
                href: "mailto:lab@evconn.ac.id",
                color: "bg-primary/10 text-primary border-primary/20",
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {social.label}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {social.handle}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
