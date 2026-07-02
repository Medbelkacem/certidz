import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@certidz/ui";

import { Faq, type FaqItem } from "@/components/marketing/faq";
import { FadeIn, Section } from "@/components/marketing/section";
import { en } from "@/lib/i18n/en";
import { cn, formatDZD } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent CertiDZ pricing in Algerian dinar. Free for individuals, Pro and Business for teams, Enterprise for government and regulated institutions."
};

interface Tier {
  name: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  highlights: string[];
}

const TIERS: Tier[] = [
  {
    name: "Free",
    priceLabel: formatDZD(0),
    priceNote: en.pricing.perMonth,
    description: "For individuals discovering qualified e-signatures.",
    cta: "Start free",
    href: "/register",
    highlights: [
      "5 documents / month",
      "1 signer per envelope",
      "Basic identity checks",
      "Hash-chained audit log",
      "Community support"
    ]
  },
  {
    name: "Pro",
    priceLabel: formatDZD(2_400),
    priceNote: en.pricing.perUserMonth,
    description: "For professionals and small teams signing every week.",
    cta: "Start Pro trial",
    href: "/register",
    featured: true,
    highlights: [
      "Unlimited documents",
      "Advanced signatures & seals",
      "AI contract summaries",
      "Reusable templates",
      "Email & chat support"
    ]
  },
  {
    name: "Business",
    priceLabel: formatDZD(5_900),
    priceNote: en.pricing.perUserMonth,
    description: "For growing companies with compliance obligations.",
    cta: "Start Business trial",
    href: "/register",
    highlights: [
      "Everything in Pro",
      "Qualified signatures",
      "Workflow automation",
      "Full KYC / liveness",
      "SSO & role-based access"
    ]
  },
  {
    name: "Enterprise",
    priceLabel: en.pricing.contactUs,
    priceNote: "Government & regulated",
    description: "For ministries, banks and national institutions.",
    cta: "Talk to sales",
    href: "/contact",
    highlights: [
      "On-prem / sovereign cloud",
      "Dedicated CA & timestamping",
      "Custom SLAs & 24/7 support",
      "Evidence packages for courts",
      "Onboarding & training"
    ]
  }
];

type Cell = boolean | string;

interface CompareRow {
  feature: string;
  values: [Cell, Cell, Cell, Cell];
}

const COMPARE_GROUPS: { group: string; rows: CompareRow[] }[] = [
  {
    group: "Signatures",
    rows: [
      { feature: "Documents per month", values: ["5", "Unlimited", "Unlimited", "Unlimited"] },
      { feature: "Simple & advanced signatures", values: [true, true, true, true] },
      { feature: "Qualified signatures (QES)", values: [false, false, true, true] },
      { feature: "Corporate seals", values: [false, true, true, true] }
    ]
  },
  {
    group: "Identity & AI",
    rows: [
      { feature: "Basic ID verification", values: [true, true, true, true] },
      { feature: "Liveness & passport NFC", values: [false, false, true, true] },
      { feature: "AI contract assistant", values: [false, true, true, true] },
      { feature: "AI clause risk flags", values: [false, false, true, true] }
    ]
  },
  {
    group: "Governance",
    rows: [
      { feature: "Hash-chained audit log", values: [true, true, true, true] },
      { feature: "SSO (SAML / OIDC)", values: [false, false, true, true] },
      { feature: "Data residency in Algeria", values: [true, true, true, true] },
      { feature: "Dedicated CA & timestamping", values: [false, false, false, true] }
    ]
  }
];

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Are the prices really in Algerian dinar?",
    answer:
      "Yes. Every plan is billed in DZD and includes VAT where applicable. Enterprise agreements can be invoiced against public-sector procurement rules."
  },
  {
    question: "What is a qualified electronic signature (QES)?",
    answer:
      "A QES is the highest legal tier under Law 15-04 and eIDAS. It is backed by a qualified certificate and, in Algeria, carries the same legal weight as a handwritten signature."
  },
  {
    question: "Where is my data hosted?",
    answer:
      "All documents, certificates and audit logs are stored in data centres located in Algeria. Enterprise customers can opt for a fully sovereign or on-premise deployment."
  },
  {
    question: "Can I change plans later?",
    answer:
      "Absolutely. You can upgrade or downgrade at any time from your organization settings, and changes are prorated to your billing cycle."
  },
  {
    question: "Do you offer discounts for universities or public bodies?",
    answer:
      "Yes. Universities, notaries and government institutions qualify for sector pricing — contact our team and we will tailor a plan."
  }
];

function CompareCell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check
          className="size-4 text-emerald-600 dark:text-emerald-400"
          aria-label="Included"
        />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className="size-4 text-muted-foreground/50" aria-label="Not included" />
      </span>
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <Section
        eyebrow="Pricing"
        heading={en.pricing.title}
        subheading={en.pricing.subtitle}
        className="!pb-10"
      >
        <div className="grid gap-6 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                "relative flex h-full flex-col rounded-2xl",
                tier.featured &&
                  "border-emerald-500/50 shadow-glow-emerald ring-1 ring-emerald-500/30"
              )}
            >
              {tier.featured ? (
                <Badge
                  variant="success"
                  className="absolute -top-3 left-6 shadow-sm"
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  {en.pricing.mostPopular}
                </Badge>
              ) : null}
              <CardContent className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-semibold text-foreground">
                    {tier.priceLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tier.priceNote}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {tier.description}
                </p>

                <Button
                  asChild
                  variant={tier.featured ? "default" : "outline"}
                  className="mt-6 w-full"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>

                <ul className="mt-6 space-y-3 border-t border-border pt-6">
                  {tier.highlights.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span className="text-foreground">{line}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices shown are indicative and exclude applicable taxes. Annual billing
          saves 20%. All plans include data residency in Algeria.
        </p>
      </Section>

      {/* Comparison table */}
      <Section
        heading="Compare every plan"
        className="bg-card !pt-4"
      >
        <FadeIn className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Feature</TableHead>
                {TIERS.map((tier) => (
                  <TableHead key={tier.name} className="text-center">
                    <span
                      className={cn(
                        tier.featured &&
                          "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {tier.name}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARE_GROUPS.map((group) => (
                <React.Fragment key={group.group}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell
                      colSpan={5}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {group.group}
                    </TableCell>
                  </TableRow>
                  {group.rows.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className="font-medium text-foreground">
                        {row.feature}
                      </TableCell>
                      {row.values.map((value, i) => (
                        <TableCell key={i} className="text-center">
                          <CompareCell value={value} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </FadeIn>
      </Section>

      {/* FAQ */}
      <Section heading={en.pricing.faqTitle} className="!pt-4">
        <Faq items={FAQ_ITEMS} />
      </Section>
    </>
  );
}
