import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";

import { Card, CardContent } from "@certidz/ui";

import { ContactForm } from "@/components/marketing/contact-form";
import { FadeIn, Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the CertiDZ team. Sales, support and partnership enquiries — from our office in Algiers, Algeria."
};

const DETAILS = [
  {
    icon: MapPin,
    label: "Office",
    lines: ["HISN Technologies SPA", "Rue Didouche Mourad", "Algiers 16000, Algeria"]
  },
  {
    icon: Mail,
    label: "Email",
    lines: ["sales@certidz.dz", "support@certidz.dz"]
  },
  {
    icon: Phone,
    label: "Phone",
    lines: ["+213 (0)21 00 00 00", "Sun–Thu"]
  },
  {
    icon: Clock,
    label: "Hours",
    lines: ["08:30 – 17:30 (GMT+1)", "Support 24/7 for Enterprise"]
  }
] as const;

export default function ContactPage() {
  return (
    <Section
      eyebrow="Contact"
      heading="Let's talk about trust"
      subheading="Whether you're a ministry, a bank or a solo founder, our team in Algiers is ready to help."
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <FadeIn>
          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <MessageSquare
                  className="size-5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold text-foreground">
                  Send us a message
                </h2>
              </div>
              <ContactForm />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="space-y-5">
          <Card className="rounded-2xl">
            <CardContent className="space-y-6 p-6 sm:p-8">
              {DETAILS.map((detail) => (
                <div key={detail.label} className="flex gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <detail.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {detail.label}
                    </p>
                    <address className="mt-1 not-italic">
                      {detail.lines.map((line) => (
                        <span
                          key={line}
                          className="block text-sm leading-relaxed text-foreground"
                        >
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div
            className="glass glass-edge relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-hero-gradient"
            role="img"
            aria-label="Map placeholder showing the CertiDZ office location in Algiers"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "28px 28px"
              }}
            />
            <span className="relative flex flex-col items-center text-navy-100">
              <span className="relative flex size-5 items-center justify-center">
                <span className="absolute inline-flex size-5 animate-ping rounded-full bg-emerald-400/60" />
                <MapPin className="relative size-5 text-emerald-300" aria-hidden="true" />
              </span>
              <span className="mt-2 text-sm font-medium">Algiers, Algeria</span>
            </span>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}
