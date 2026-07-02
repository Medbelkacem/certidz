import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Globe2,
  Heart,
  Lock,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users
} from "lucide-react";

import { Avatar, AvatarFallback, Badge, Button, Card, CardContent } from "@certidz/ui";

import { FadeIn, Section, Stagger, StaggerItem } from "@/components/marketing/section";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About HISN",
  description:
    "HISN builds CertiDZ — the sovereign digital-trust platform for Algeria and Africa. Our mission, story, values and the team behind qualified e-signatures."
};

const VALUES = [
  {
    icon: Lock,
    title: "Sovereignty first",
    copy: "Data stays in Algeria, under Algerian law. Trust cannot be outsourced."
  },
  {
    icon: ShieldCheck,
    title: "Security by design",
    copy: "Every signature is tamper-evident and every action is hash-chained."
  },
  {
    icon: Heart,
    title: "Built for people",
    copy: "Enterprise-grade power that a first-time signer can use without a manual."
  },
  {
    icon: Globe2,
    title: "Made for Africa",
    copy: "Tuned for Algerian and African documents, languages and regulations."
  }
] as const;

const STORY = [
  {
    year: "2023",
    title: "HISN is founded in Algiers",
    copy: "A team of Algerian cryptographers and product engineers set out to give the continent its own trust infrastructure."
  },
  {
    year: "2024",
    title: "CertiDZ enters private beta",
    copy: "The first qualified signatures are issued to pilot banks and public institutions under Law 15-04."
  },
  {
    year: "2025",
    title: "AI trust layer ships",
    copy: "Contract intelligence in Arabic, French and English joins the platform alongside liveness verification."
  },
  {
    year: "2026",
    title: "Scaling across Africa",
    copy: "CertiDZ powers signatures for 180+ institutions and opens its API to developers across the region."
  }
] as const;

const TEAM = [
  { name: "Amine Benali", role: "Co-founder & CEO", color: "bg-navy-600" },
  { name: "Meriem Laouar", role: "Co-founder & CTO", color: "bg-emerald-600" },
  { name: "Yasmine Cherif", role: "Head of Product", color: "bg-gold-600" },
  { name: "Sofiane Ziani", role: "Head of Security", color: "bg-navy-500" },
  { name: "Nadia Mansouri", role: "Head of Compliance", color: "bg-emerald-700" },
  { name: "Karim Haddad", role: "Head of Engineering", color: "bg-navy-700" }
] as const;

const REACH = [
  "Algiers",
  "Oran",
  "Constantine",
  "Ouargla",
  "Tunis",
  "Casablanca",
  "Dakar",
  "Abidjan"
] as const;

export default function AboutPage() {
  return (
    <>
      {/* Mission hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-navy-50">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-28">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
              <Compass className="size-3.5" aria-hidden="true" />
              About HISN
            </span>
            <h1 className="font-display mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Giving Algeria and Africa a trust layer they can call their own.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-200 sm:text-lg">
              HISN Technologies builds CertiDZ so that any citizen, company or
              institution can sign, verify and trust digital documents without
              depending on foreign infrastructure.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission / vision cards */}
      <Section className="!py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <FadeIn>
            <Card className="h-full rounded-2xl">
              <CardContent className="p-8">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy-900 text-emerald-400 dark:bg-navy-800">
                  <Target className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-foreground">
                  Our mission
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  To make digital trust the default across Africa — so that a
                  signed document is instantly verifiable, legally binding and
                  sovereign, wherever it travels.
                </p>
              </CardContent>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Card className="h-full rounded-2xl">
              <CardContent className="p-8">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400 dark:bg-navy-800">
                  <Rocket className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-foreground">
                  Our vision
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A continent where governments, banks and startups build on a
                  shared, home-grown trust infrastructure — secure, inclusive and
                  independent by design.
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* Story timeline */}
      <Section
        eyebrow="Our story"
        heading="From an Algiers whiteboard to a continental platform"
        className="bg-card"
      >
        <Stagger className="mx-auto max-w-3xl space-y-6">
          {STORY.map((entry) => (
            <StaggerItem key={entry.year}>
              <div className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="font-display flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {entry.year}
                  </span>
                  <span className="mt-2 w-px flex-1 bg-border" aria-hidden="true" />
                </div>
                <div className="pb-2 pt-3">
                  <h3 className="text-base font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {entry.copy}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Values */}
      <Section
        eyebrow="What we believe"
        heading="The values behind every signature"
      >
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <StaggerItem key={value.title}>
              <Card className="h-full rounded-2xl">
                <CardContent className="p-6">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy-900 text-emerald-400 dark:bg-navy-800">
                    <value.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {value.copy}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Reach / map-vibe */}
      <Section className="!py-16" dark>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
              <Globe2 className="size-3.5" aria-hidden="true" />
              Our reach
            </span>
            <h2 className="font-display mt-5 text-3xl font-semibold text-white sm:text-4xl">
              Rooted in Algeria, growing across Africa
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-navy-200">
              Our infrastructure runs from Algiers, with a growing footprint
              across North and West Africa. Every region we enter keeps its data
              close to home.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {REACH.map((city) => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-navy-100"
                >
                  <MapPin className="size-3.5 text-emerald-300" aria-hidden="true" />
                  {city}
                </span>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              className="glass glass-edge relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl"
              role="img"
              aria-label="Stylised map highlighting CertiDZ's presence across Africa, centred on Algeria"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                  backgroundSize: "22px 22px"
                }}
              />
              <Globe2
                className="size-40 text-emerald-400/40"
                aria-hidden="true"
                strokeWidth={0.75}
              />
              <span className="absolute left-1/2 top-[38%] flex -translate-x-1/2 flex-col items-center">
                <span className="relative flex size-4 items-center justify-center">
                  <span className="absolute inline-flex size-4 animate-ping rounded-full bg-gold-400/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-gold-400" />
                </span>
                <Badge variant="gold" className="mt-2">
                  Algiers HQ
                </Badge>
              </span>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* Team */}
      <Section
        eyebrow="The team"
        heading="Builders you can trust"
        subheading="A team of Algerian engineers, cryptographers and compliance experts."
      >
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <StaggerItem key={member.name}>
              <Card className="h-full rounded-2xl">
                <CardContent className="flex items-center gap-4 p-6">
                  <Avatar className="size-14">
                    <AvatarFallback
                      className={`${member.color} text-base font-semibold text-white`}
                    >
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-12 text-center">
          <div className="mx-auto max-w-xl">
            <Users
              className="mx-auto size-8 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h3 className="font-display mt-4 text-2xl font-semibold text-foreground">
              We&apos;re hiring across Algeria
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Join the team building the trust layer for a continent.
            </p>
            <Button asChild className="mt-6">
              <Link href="/contact">
                <Sparkles aria-hidden="true" />
                Get in touch
              </Link>
            </Button>
          </div>
        </FadeIn>
      </Section>
    </>
  );
}
