import Link from "next/link";
import Image from "next/image";
import { Github, Instagram, Linkedin, Mail, MapPin, Phone, MessageCircle } from "lucide-react";

const footerLinks = {
  platform: [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    { label: "News", href: "/news" },
    { label: "Gallery", href: "/gallery" },
    { label: "Hall of Fame", href: "/hall-of-fame" },
  ],
  learning: [
    { label: "Practicum", href: "/lms/dashboard" },
    { label: "Study Group", href: "/lms/dashboard" },
    { label: "Register", href: "/register" },
    { label: "Sign In", href: "/login" },
  ],
  info: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Organization", href: "/about#organisasi" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/evconn-light.png" alt="EvConn Laboratory" width={26} height={26} className="rounded-sm" />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                EvConn <span className="text-primary">Lab</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The integrated digital platform for practicum sessions, study
              groups, and academic management in Computer Engineering.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                {
                  href: "https://line.me/R/ti/p/@077xjusr?from=page&utm_source=ig&utm_medium=social&utm_content=link_in_bio&searchId=077xjusr",
                  icon: MessageCircle,
                  label: "Line",
                },
                
                {
                  href: "https://instagram.com/labevconn",
                  icon: Instagram,
                  label: "Instagram",
                },
                {
                  href: "https://linkedin.com/company/evconn-laboratory",
                  icon: Linkedin,
                  label: "LinkedIn",
                },
                { href: "https://github.com/EvConn-Laboratory", icon: Github, label: "GitHub" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
              Learning
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.learning.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:evconn@telkomuniversity.ac.id"
                  className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  evconn@telkomuniversity.ac.id
                </a>
              </li>
              <li>
                <span className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  Telkom University Landmark Tower TULT-14.12 Bandung, West Java 40257
                </span>
              </li>
            </ul>
            <div className="mt-4 space-y-2">
              {footerLinks.info.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {year} EvConn Laboratory. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with{" "}
            <span className="text-foreground/80">Love</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
