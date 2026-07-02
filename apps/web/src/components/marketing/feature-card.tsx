import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@certidz/ui";

import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group h-full rounded-2xl border-border/70 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-navy-900 text-emerald-400 shadow-sm transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-navy-800">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
