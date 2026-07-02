import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "@certidz/ui";

import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  /** Signed percentage delta vs previous period. */
  delta: number;
  deltaLabel: string;
  icon: LucideIcon;
  /** Small series used for the CSS bar sparkline. */
  sparkline: number[];
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  sparkline
}: StatCardProps) {
  const isUp = delta >= 0;
  const max = Math.max(...sparkline, 1);

  return (
    <Card className="glass glass-edge relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              isUp
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            )}
          >
            {isUp ? (
              <ArrowUpRight className="size-4" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-4" aria-hidden="true" />
            )}
            {isUp ? "+" : ""}
            {delta}%
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>

        {/* CSS bar sparkline */}
        <div
          className="flex h-8 items-end gap-0.5"
          role="img"
          aria-label={`Trend for ${label}`}
        >
          {sparkline.map((point, i) => (
            <span
              key={i}
              className={cn(
                "w-1 rounded-full",
                isUp ? "bg-emerald-500/70" : "bg-gold-500/70"
              )}
              style={{ height: `${Math.max((point / max) * 100, 8)}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
