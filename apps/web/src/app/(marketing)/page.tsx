import Link from "next/link";
import {
  Banknote,
  BrainCircuit,
  Building2,
  FileSignature,
  Fingerprint,
  GraduationCap,
  Landmark,
  Quote,
  Scale,
  ScrollText,
  ShieldCheck,
  Stamp,
  Workflow
} from "lucide-react";

import { Badge, Button, Card, CardContent } from "@certidz/ui";

import { FeatureCard } from "@/components/marketing/feature-card";
import { Hero } from "@/components/marketing/hero";
import { FadeIn, Section, Stagger, StaggerItem } from "@/components/marketing/section";
import { en } from "@/lib/i18n/en";

const PILLARS = [
  {
    icon: FileSignature,
    title: "Electronic Signatures",
    description:
      "Simple, advanced and qualified e-signatures with tamper-evident, court-ready audit trails."
  },
  {
    icon: Fingerprint,
    title: "Identity Verification",
    description:
      "Verify national ID cards, passports and liveness in seconds — tuned for Algerian documents."
  },
  {
    icon: BrainCircuit,
    title: "AI Intelligence",
    description:
      "Summarize contracts, flag risky clauses and extract obligations in Arabic, French and English."
  },
  {
    icon: ShieldCheck,
    title: "PKI Certificates",
    description:
      "Managed X.509 certificates, corporate seals and timestamping backed by a sovereign CA."
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Route documents through approval chains, reminders and KYC gates without writing code."
  },
  {
    icon: ScrollText,
    title: "Compliance & Audit",
    description:
      "Hash-chained logs and evidence packages built to satisfy regulators and internal auditors."
  }
] as const;

const STEPS = [
  {
    icon: FileSignature,
    step: "01",
    title: en.howItWorks.steps[0].title,
    description: en.howItWorks.steps[0].description
  },
  {
    icon: Fingerprint,
    step: "02",
    title: en.howItWorks.steps[1].title,
    description: en.howItWorks.steps[1].description
  },
  {
    icon: Stamp,
    step: "03",
    title: en.howItWorks.steps[2].title,
    description: en.howItWorks.steps[2].description
  }
] as const;

const STATS = [
  { value: "2.4M+", label: "Documents signed" },
  { value: "99.9%", label: "Platform uptime" },
  { value: "98.4%", label: "Verification accuracy" },
  { value: "180+", label: "Institutions onboard" }
] as const;

const USE_CASES = [
  { icon: Landmark, title: "Government", copy: "Marchés publics & tenders" },
  { icon: Banknote, title: "Banks", copy: "KYC-first loan agreements" },
  { icon: GraduationCap, title: "Universities", copy: "Diplomas & transcripts" },
  { icon: Stamp, title: "Notaries", copy: "Authenticated deeds" },
  { icon: Scale, title: "Law firms", copy: "Contracts & filings" }
] as const;

export default function LandingPage() {
  return (
    <>
      <Hero />

      {/* Trust / compliance badge strip */}
      <section
        aria-label={en.trustBadges.heading}
        className="border-y border-border bg-card"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {en.trustBadges.heading}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              "eIDAS-ready",
              "Law 15-04",
              "ISO/IEC 27001",
              "Hosted in Algeria"
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <ShieldCheck
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product pillars */}
      <Section
        id="product"
        eyebrow="The platform"
        heading={en.pillars.heading}
        subheading={en.pillars.subheading}
      >
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <StaggerItem key={pillar.title}>
              <FeatureCard
                icon={pillar.icon}
                title={pillar.title}
                description={pillar.description}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* How it works */}
      <Section
        id="how"
        eyebrow="Simple by design"
        heading={en.howItWorks.heading}
        subheading={en.howItWorks.subheading}
        className="bg-card"
      >
        <Stagger className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <StaggerItem key={step.step} className="relative">
              <Card className="h-full rounded-2xl">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-navy-900 text-emerald-400 dark:bg-navy-800">
                      <step.icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="font-display text-4xl font-semibold text-border">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              {i < STEPS.length - 1 ? (
                <div
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-border md:block"
                />
              ) : null}
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Stats band */}
      <Section className="!py-16" dark>
        <FadeIn className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-navy-300">
            Indicative figures — for illustration
          </p>
        </FadeIn>
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="font-display block text-4xl font-semibold text-white sm:text-5xl">
                  {stat.value}
                </span>
                <span className="mt-2 block text-sm text-navy-200">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Use cases */}
      <Section
        eyebrow="Who uses CertiDZ"
        heading="Built for Algeria's institutions"
        subheading="From ministries to notaries, CertiDZ adapts to the rules each sector must follow."
      >
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {USE_CASES.map((uc) => (
            <StaggerItem key={uc.title}>
              <Card className="h-full rounded-2xl text-center transition-colors hover:border-emerald-500/40">
                <CardContent className="flex flex-col items-center p-6">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <uc.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {uc.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{uc.copy}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Testimonial */}
      <Section className="!pt-0">
        <FadeIn>
          <Card className="overflow-hidden rounded-3xl border-border/70">
            <CardContent className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <Quote
                  className="size-8 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <blockquote className="font-display mt-4 text-2xl font-medium leading-snug text-foreground sm:text-3xl">
                  {en.auth.brandQuote}
                </blockquote>
                <p className="mt-6 text-sm font-medium text-muted-foreground">
                  {en.auth.brandQuoteAuthor}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                  {en.testimonials.heading}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Numidia Bank", "Saharatech", "Atlas Assurances", "HISN"].map(
                    (name) => (
                      <Badge key={name} variant="outline">
                        {name}
                      </Badge>
                    )
                  )}
                </div>
                <p className="mt-4 text-sm text-secondary-foreground/90">
                  {en.testimonials.subheading}
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </Section>

      {/* Big CTA */}
      <Section className="!pt-0">
        <FadeIn>
          <div className="glass-edge relative overflow-hidden rounded-3xl bg-hero-gradient px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(40rem 20rem at 50% 120%, rgba(16,185,129,0.35), transparent 60%)"
              }}
            />
            <div className="relative mx-auto max-w-2xl">
              <Building2
                className="mx-auto size-10 text-gold-400"
                aria-hidden="true"
              />
              <h2 className="font-display mt-6 text-3xl font-semibold text-white sm:text-4xl">
                {en.cta.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-navy-200 sm:text-lg">
                {en.cta.subtitle}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="gold" className="shadow-glow-gold">
                  <Link href="/register">{en.cta.button}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white"
                >
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>
    </>
  );
}
