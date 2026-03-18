import type { Metadata } from "next";
import { Poppins, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

/** Body / UI — friendly, modern, geometric */
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** Display / headings — geometric, techy, distinctive */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Monospace — code blocks, labels */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EvConn Laboratory",
    template: "%s | EvConn Laboratory",
  },
  description:
    "The integrated digital platform for EvConn Laboratory — practical learning, study groups, and laboratory management.",
  keywords: ["laboratory", "praktikum", "LMS", "study group", "evconn"],
  authors: [{ name: "EvConn Laboratory" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "EvConn Laboratory",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <PwaInstallPrompt />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker
                    .register('/sw.js')
                    .catch(function (err) {
                      console.error('[SW] Registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
