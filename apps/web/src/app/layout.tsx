import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { Toaster } from "@certidz/ui";

import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_LOCALE, dirFor } from "@/lib/i18n/en";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://certidz.dz"),
  title: {
    default: "CertiDZ — Digital Trust Platform for Algeria & Africa",
    template: "%s | CertiDZ"
  },
  description:
    "CertiDZ by HISN: qualified e-signatures, AI-powered identity verification, PKI certificates and hash-chained audit trails. eIDAS-ready, Law 15-04 compliant, hosted in Algeria.",
  keywords: [
    "electronic signature",
    "Algeria",
    "digital trust",
    "PKI",
    "identity verification",
    "eIDAS",
    "Law 15-04"
  ],
  openGraph: {
    title: "CertiDZ — Sign. Verify. Trust.",
    description:
      "The trusted AI-powered digital trust platform for Algeria and Africa.",
    url: "https://certidz.dz",
    siteName: "CertiDZ",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "CertiDZ — Sign. Verify. Trust.",
    description:
      "The trusted AI-powered digital trust platform for Algeria and Africa."
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070d1a" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  // Locale is static for now; when FR/AR land, resolve it per-request and
  // `dirFor` flips the document to RTL for Arabic automatically.
  const locale = DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
