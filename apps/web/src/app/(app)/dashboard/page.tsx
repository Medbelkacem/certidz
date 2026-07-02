import type { Metadata } from "next";
import Link from "next/link";
import {
  FileSignature,
  IdCard,
  ShieldCheck,
  Stamp,
  UploadCloud,
  type LucideIcon
} from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { cn, formatRelative } from "@/lib/utils";
import { en } from "@/lib/i18n/en";
import {
  envelopeDistribution,
  kpiStats,
  recentActivity
} from "@/lib/mock-data";
import {
  envelopeStatusColor,
  envelopeStatusLabel,
  kpiIcons,
  kpiSparklines,
  quickActions
} from "@/lib/app-mock-data";

export const metadata: Metadata = { title: "Dashboard" };

const activityIcon: Record<string, LucideIcon> = {
  signature: FileSignature,
  envelope: UploadCloud,
  identity: IdCard,
  certificate: Stamp,
  security: ShieldCheck
};

const activityTone: Record<string, string> = {
  signature: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  envelope: "bg-navy-500/10 text-navy-600 dark:text-navy-300",
  identity: "bg-gold-500/10 text-gold-600 dark:text-gold-300",
  certificate: "bg-gold-500/10 text-gold-600 dark:text-gold-300",
  security: "bg-destructive/10 text-destructive"
};

function buildDonut() {
  const total = envelopeDistribution.reduce((sum, d) => sum + d.count, 0);
  let acc = 0;
  const stops = envelopeDistribution.map((d) => {
    const start = (acc / total) * 360;
    acc += d.count;
    const end = (acc / total) * 360;
    const color = envelopeStatusColor[d.status] ?? "var(--color-muted-foreground)";
    return `${color} ${start}deg ${end}deg`;
  });
  return { gradient: `conic-gradient(${stops.join(", ")})`, total };
}

export default function DashboardPage() {
  const { gradient, total } = buildDonut();

  return (
    <div>
      <PageHeader
        title="Welcome back, Meriem"
        description="Here is what is happening across your digital-trust workspace today."
        actions={
          <Button asChild variant="gold">
            <Link href="/envelopes/new">
              <FileSignature aria-hidden="true" /> New envelope
            </Link>
          </Button>
        }
      />

      {/* KPI row */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiStats.map((stat) => (
          <StatCard
            key={stat.key}
            label={en.app.kpis[stat.key]}
            value={stat.value}
            delta={stat.delta}
            deltaLabel={stat.deltaLabel}
            icon={kpiIcons[stat.key] ?? FileSignature}
            sparkline={kpiSparklines[stat.key] ?? []}
          />
        ))}
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="mt-4 grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  action.variant === "gold"
                    ? "bg-gold-500/15 text-gold-600 dark:text-gold-300"
                    : action.variant === "outline"
                      ? "bg-navy-500/10 text-navy-600 dark:text-navy-300"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {action.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      {/* Activity + donut */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Recent activity timeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/audit">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-6 before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-border">
              {recentActivity.map((item) => {
                const Icon = activityIcon[item.kind] ?? FileSignature;
                return (
                  <li key={item.id} className="relative flex gap-4">
                    <span
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                        activityTone[item.kind]
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{item.actor}</span>{" "}
                        {item.action}{" "}
                        <span className="font-medium text-muted-foreground">
                          {item.target}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelative(item.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Envelope status donut */}
        <Card>
          <CardHeader>
            <CardTitle>Envelope status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div className="relative size-40">
                <div
                  className="size-40 rounded-full"
                  style={{ background: gradient }}
                  role="img"
                  aria-label="Distribution of envelopes by status"
                />
                <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-card text-center">
                  <span className="font-display text-2xl font-semibold text-foreground">
                    {total}
                  </span>
                  <span className="text-xs text-muted-foreground">envelopes</span>
                </div>
              </div>
              <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
                {envelopeDistribution.map((d) => (
                  <li key={d.status} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: envelopeStatusColor[d.status] }}
                    />
                    <span className="flex-1 truncate text-muted-foreground">
                      {envelopeStatusLabel[d.status]}
                    </span>
                    <span className="font-medium text-foreground">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
