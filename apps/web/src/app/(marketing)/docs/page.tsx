import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Fingerprint,
  KeyRound,
  Search,
  Terminal,
  Webhook
} from "lucide-react";

import { Badge, Card, CardContent } from "@certidz/ui";

import { FadeIn, Section, Stagger, StaggerItem } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "CertiDZ developer documentation — guides and API references for signatures, identity verification, webhooks and SDKs."
};

const SECTIONS = [
  {
    icon: BookOpen,
    title: "Getting started",
    description:
      "Create your first envelope, understand core concepts and go from zero to a signed document in ten minutes.",
    tag: "Guide",
    href: "/docs"
  },
  {
    icon: Terminal,
    title: "Signatures API",
    description:
      "Create envelopes, add signers and fields, and download completed documents with their evidence package.",
    tag: "REST",
    href: "/docs"
  },
  {
    icon: Fingerprint,
    title: "Identity API",
    description:
      "Run ID document checks, liveness and NFC passport verification tuned for Algerian and African documents.",
    tag: "REST",
    href: "/docs"
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description:
      "Subscribe to envelope, signature and verification events with signed, replay-protected payloads.",
    tag: "Events",
    href: "/docs"
  },
  {
    icon: Boxes,
    title: "SDKs",
    description:
      "Official libraries for Node.js, Python, PHP and a mobile SDK for embedding identity capture.",
    tag: "Libraries",
    href: "/docs"
  },
  {
    icon: KeyRound,
    title: "Authentication",
    description:
      "API keys, OAuth 2.0 scopes and short-lived tokens — plus how to rotate secrets safely.",
    tag: "Security",
    href: "/docs"
  }
] as const;

const POPULAR = [
  "Create an envelope",
  "Verify a national ID (CNIBE)",
  "Handle webhook signatures",
  "Download an evidence package",
  "Set up SSO"
] as const;

export default function DocsPage() {
  return (
    <>
      <Section className="!pb-8" >
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <BookOpen className="size-3.5" aria-hidden="true" />
            Developer documentation
          </span>
          <h1 className="font-display mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Build trust into your product
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Everything you need to integrate signatures, identity and PKI into
            your own apps and workflows.
          </p>

          {/* Search-looking box (non-functional placeholder) */}
          <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 text-left shadow-sm">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-sm text-muted-foreground">
              Search the docs…
            </span>
            <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Popular:
            </span>
            {POPULAR.map((item) => (
              <Link
                key={item}
                href="/docs"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item}
              </Link>
            ))}
          </div>
        </FadeIn>
      </Section>

      <Section className="!pt-4">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <StaggerItem key={section.title}>
              <Link
                href={section.href}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="h-full rounded-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-emerald-500/40 group-hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy-900 text-emerald-400 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-navy-800">
                        <section.icon className="size-5" aria-hidden="true" />
                      </span>
                      <Badge variant="outline">{section.tag}</Badge>
                    </div>
                    <h2 className="mt-5 text-base font-semibold text-foreground">
                      {section.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {section.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Read docs
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
